import { supabase } from '../supabase/client';
import { BackblazeService } from './backblaze';

export interface Document {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_path: string;
  file_type: string;
  uploaded_at: string;
  uploaded_by?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  mime_type?: string;
  document_number?: string;
  issuing_authority?: string;
  expiry_date?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  type: 'company' | 'employee';
  companyName?: string;
  employeeId?: string;
  employeeName?: string;
  documentCount: number;
  lastModified: string;
  path: string;
}

export interface UploadDocumentData {
  employee_id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  file_path: string;
  file_type: string;
  notes?: string;
}

export class DocumentService {
  // Enhanced cache for document folders to improve performance
  private static foldersCache: { folders: DocumentFolder[]; timestamp: number } | null = null;
  private static companyDocumentsCache: { documents: Document[]; timestamp: number } | null = null;
  // Optional server-side aggregates (materialized views) – used if available
  private static readonly COMPANY_FOLDERS_VIEW = 'company_document_folders_mv';
  private static readonly EMPLOYEE_COUNTS_VIEW = 'employee_counts_by_company_mv';
  // Per-company folders cache and in-flight dedupe
  private static employeeFoldersCache: Map<string, { folders: DocumentFolder[]; timestamp: number }> = new Map();
  private static employeeFoldersInflight: Map<string, Promise<{ folders: DocumentFolder[]; error: string | null }>> = new Map();
  // Per-company documents (raw) cache for getEmployeeFolders to reuse heavy pagination results
  private static companyDocsRawCache: Map<string, { docs: any[]; timestamp: number }> = new Map();
  private static companyDocsInflight: Map<string, Promise<{ documents: any[]; error: string | null }>> = new Map();
  // Per-employee documents cache and in-flight dedupe
  private static employeeDocsCache: Map<string, { documents: Document[]; timestamp: number }> = new Map();
  private static employeeDocsInflight: Map<string, Promise<{ documents: Document[]; error: string | null }>> = new Map();

  private static readonly SUPABASE_PAGE_SIZE = 500; // Reduced for better performance // Supabase hard page limit
  
  // Performance monitoring
  private static performanceMetrics: Map<string, number[]> = new Map();
  private static isCurrentlyFetching = false;
  private static fetchPromise: Promise<{ folders: DocumentFolder[]; error: string | null }> | null = null;
  // Fast-path caching for presigned URLs to avoid repeated edge calls
  private static presignedUrlCache: Map<string, { url: string; expiresAt: number }> = new Map();
  private static presignedUrlInflight: Map<string, Promise<{ data: string | null; error: string | null }>> = new Map();
  // Lightweight cache from file_path -> signed url for batch prefetch
  private static presignedByPathCache: Map<string, { url: string; expiresAt: number }> = new Map();
  // Prefix auth cache to allow composing stream URLs without per-file sign
  private static prefixAuthCache: Map<string, { prefix: string; token: string; downloadBase: string; expiresAt: number }> = new Map();

  // Build a same-origin streaming URL for a given file path. Ensures prefix token exists.
  static async getStreamUrlByPath(filePath: string, employeeId?: string): Promise<string | null> {
    try {
      if (!filePath) return null;
      // Determine a likely prefix from the filePath when employeeId not provided
      let prefix: string | null = null;
      if (filePath.includes('/')) {
        const parts = filePath.split('/');
        // e.g., EMP_EMP001/foo.pdf -> EMP_EMP001/
        prefix = parts.slice(0, 1).join('/') + '/';
      }
      if (employeeId) {
        prefix = `EMP_${employeeId}/`;
      }
      if (!prefix) return null;

      const now = Date.now();
      let cached = DocumentService.prefixAuthCache.get(prefix);
      if (!cached || now >= cached.expiresAt) {
        const { data: edgeResult, error } = await supabase.functions.invoke('doc-manager', {
          body: { action: 'getPrefixAuth', empId: employeeId, filePath: prefix }
        });
        if (error || !edgeResult?.success || !edgeResult?.authorizationToken || !edgeResult?.downloadUrl) {
          return null;
        }
        cached = {
          prefix: edgeResult.prefix,
          token: edgeResult.authorizationToken,
          downloadBase: edgeResult.downloadUrl,
          expiresAt: now + 55 * 60 * 1000,
        };
        DocumentService.prefixAuthCache.set(prefix, cached);
      }

      const params = new URLSearchParams();
      params.set('path', filePath);
      params.set('prefix', cached.prefix);
      params.set('token', cached.token);
      params.set('base', cached.downloadBase);
      return `/api/documents/stream?${params.toString()}`;
    } catch (e) {
      return null;
    }
  }
  
  // Prevent multiple concurrent fetches


  // Cache timestamps for intelligent invalidation
  private static cacheTimestamps = new Map<string, number>();
  private static CACHE_DURATIONS = {
    companies: 15 * 60 * 1000,     // 15 minutes for company folders
    employees: 10 * 60 * 1000,     // 10 minutes for employee folders  
    documents: 5 * 60 * 1000       // 5 minutes for documents
  };

  // Check if cache is still valid
  private static isCacheValid(key: string, duration: number): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < duration;
  }

  // Clear cache method for immediate updates
  static clearCache(): void {
    this.foldersCache = null;
    this.companyDocumentsCache = null;
    this.employeeFoldersCache.clear();
    this.employeeFoldersInflight.clear();
    this.companyDocsRawCache.clear();
    this.companyDocsInflight.clear();
    this.employeeDocsCache.clear();
    this.employeeDocsInflight.clear();
    this.presignedUrlCache.clear();
    this.presignedUrlInflight.clear();
    this.performanceMetrics.clear();
    this.cacheTimestamps.clear();
    this.isCurrentlyFetching = false;
    this.fetchPromise = null;
    console.log('🧹 All document service caches cleared');
  }

  // Performance monitoring helper
  private static logPerformance(operation: string, duration: number) {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    this.performanceMetrics.get(operation)!.push(duration);
    
    if (duration > 2000) {
      console.warn(`⚠️ Very slow operation: ${operation} took ${duration.toFixed(2)}ms`);
    } else if (duration > 1000) {
      console.warn(`⚠️ Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      console.log(`⚠️ Moderate operation: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  // Intelligent cache invalidation - only clear specific caches
  static invalidateCache(type: 'folders' | 'company' | 'employee' | 'all' = 'all', companyName?: string, employeeId?: string): void {
    switch (type) {
      case 'folders':
        this.foldersCache = null;
        console.log('🧹 Cleared folders cache');
        break;
      case 'company':
        if (companyName) {
          this.employeeFoldersCache.delete(companyName);
          this.employeeFoldersInflight.delete(companyName);
          this.companyDocsRawCache.delete(companyName);
          this.companyDocsInflight.delete(companyName);
          console.log(`🧹 Cleared company cache for: ${companyName}`);
        } else {
          this.employeeFoldersCache.clear();
          this.employeeFoldersInflight.clear();
          this.companyDocsRawCache.clear();
          this.companyDocsInflight.clear();
          console.log('🧹 Cleared all company caches');
        }
        break;
      case 'employee':
        if (employeeId) {
          this.employeeDocsCache.delete(employeeId);
          this.employeeDocsInflight.delete(employeeId);
          console.log(`🧹 Cleared employee cache for: ${employeeId}`);
        } else {
          this.employeeDocsCache.clear();
          this.employeeDocsInflight.clear();
          console.log('🧹 Cleared all employee caches');
        }
        break;
      case 'all':
        this.clearCache();
        break;
    }
  }

  // Clear all caches and force refresh
  static async forceRefresh(): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    this.clearCache();
    return this.getDocumentFolders();
  }

  // Clear employee folder cache for a specific company
  static clearEmployeeFolderCache(companyName?: string): void {
    if (companyName) {
      this.employeeFoldersCache.delete(companyName);
      this.employeeFoldersInflight.delete(companyName);
      console.log(`🧹 Cleared employee folder cache for: ${companyName}`);
    } else {
      this.employeeFoldersCache.clear();
      this.employeeFoldersInflight.clear();
      console.log('🧹 Cleared all employee folder caches');
    }
  }

  // Fetch ALL documents using pagination to bypass Supabase 1000 record limit
  private static async fetchAllDocuments(): Promise<{ documents: any[]; error: string | null }> {
    try {
      if (process.env.NODE_ENV !== 'production') console.log('📄 Fetching documents (paginated)...');

      const pageSize = this.SUPABASE_PAGE_SIZE;
      let from = 0;
      let to = pageSize - 1;
      const allDocuments: any[] = [];

      // Limit to first 1000 documents to prevent infinite loading
      let batchCount = 0;
      const maxBatches = 2; // Only fetch 2 batches (1000 documents max)
      
      while (batchCount < maxBatches) {
        const { data, error } = await supabase
          .from('employee_documents')
          .select('file_path, uploaded_at')
          .order('uploaded_at', { ascending: false })
          .range(from, to);

        if (error) {
          console.error('❌ Error fetching documents:', error);
          return { documents: [], error: error.message };
        }

        const batch = data || [];
        allDocuments.push(...batch);
        if (process.env.NODE_ENV !== 'production') console.log(`  • batch ${from}-${to} → ${batch.length}`);

        if (batch.length < pageSize) break;
        from += pageSize;
        to += pageSize;
        batchCount++;
      }

      if (process.env.NODE_ENV !== 'production') console.log(`✅ Found ${allDocuments.length} documents (across ${Math.ceil(allDocuments.length / pageSize)} page(s))`);
      return { documents: allDocuments, error: null };
    } catch (error) {
      console.error('❌ Error in fetchAllDocuments:', error);
      return { documents: [], error: 'Failed to fetch all documents' };
    }
  }

  // Fetch ALL documents for a specific company using pagination
  private static async fetchAllCompanyDocuments(companyName: string): Promise<{ documents: any[]; error: string | null }> {
    try {
      if (process.env.NODE_ENV !== 'production') console.log(`📄 Fetching documents for company (paginated): ${companyName}...`);

      // Cache and in-flight dedupe for heavy paginated call - OPTIMIZED
      const cached = this.companyDocsRawCache.get(companyName);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATIONS.documents * 2) { // Extended cache duration
        console.log('✅ Cache hit for company documents:', companyName);
        return { documents: cached.docs, error: null };
      }
      const inflight = this.companyDocsInflight.get(companyName);
      if (inflight) {
        console.log('🔄 Inflight request found for company documents:', companyName);
        return inflight;
      }

      const pageSize = this.SUPABASE_PAGE_SIZE;
      let from = 0;
      let to = pageSize - 1;
      const allDocuments: any[] = [];

      // Build base filtered query per company - OPTIMIZED
      const buildQuery = (fromIdx: number, toIdx: number) => {
        // Use more efficient query with proper indexing hints
        let q = supabase
          .from('employee_documents')
          .select('employee_id, file_path, uploaded_at, file_name')
          .order('uploaded_at', { ascending: false }) // Add ordering for consistent results
          .range(fromIdx, toIdx);

        // Use more efficient filtering
        if (companyName === 'AL HANA TOURS & TRAVELS' || companyName === 'AL HANA TOURS and TRAVELS') {
          // Use ILIKE for case-insensitive matching and better performance
          q = q.or(
            [
              'file_path.ilike.EMP_ALHT/%',
              'file_path.ilike.AL HANA TOURS and TRAVELS/%',
              'file_path.ilike.AL HANA TOURS & TRAVELS/%'
            ].join(',')
          );
        } else {
          // Use ILIKE for better performance and case-insensitive matching
          q = q.ilike('file_path', `${companyName}/%`);
        }
        return q;
      };

      const run = async () => {
        const startTime = performance.now();
        let batchCount = 0;
        
        while (true) {
          batchCount++;
          const batchStartTime = performance.now();
          
          // Add timeout protection for each batch
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 10000)
          );
          
          const queryPromise = buildQuery(from, to);
          const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
          
          if (error) {
            console.error(`❌ Error fetching documents for ${companyName}:`, error);
            return { documents: [], error: error.message };
          }
          
          const batch = data || [];
          allDocuments.push(...batch);
          
          const batchDuration = performance.now() - batchStartTime;
          if (process.env.NODE_ENV !== 'production') {
            console.log(`  • ${companyName} batch ${from}-${to} → ${batch.length} (${batchDuration.toFixed(2)}ms)`);
          }
          
          if (batch.length < pageSize) break;
          from += pageSize;
          to += pageSize;
          
          // Add small delay between batches to prevent overwhelming the database
          if (batchCount > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        const totalDuration = performance.now() - startTime;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`✅ Found ${allDocuments.length} documents for ${companyName} in ${totalDuration.toFixed(2)}ms`);
        }

        if (process.env.NODE_ENV !== 'production') console.log(`✅ Found ${allDocuments.length} documents for ${companyName}`);
        console.log('🔍 Sample documents:', allDocuments.slice(0, 3).map(d => ({ employee_id: d.employee_id, file_path: d.file_path })));
        // Save to cache
        this.companyDocsRawCache.set(companyName, { docs: allDocuments, timestamp: Date.now() });
        return { documents: allDocuments, error: null };
      };

      const promise = run().finally(() => {
        this.companyDocsInflight.delete(companyName);
      });
      this.companyDocsInflight.set(companyName, promise);
      return promise;
    } catch (error) {
      console.error(`❌ Error in fetchAllCompanyDocuments for ${companyName}:`, error);
      return { documents: [], error: 'Failed to fetch company documents' };
    }
  }



  // Get documents for a specific employee (optimized with pagination)
  static async getDocumentsForEmployee(employeeId: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      // Extended cache duration for better performance
      const cached = this.employeeDocsCache.get(employeeId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATIONS.documents * 2) { // Extended cache duration
        return { documents: cached.documents, error: null };
      }
      const inflight = this.employeeDocsInflight.get(employeeId);
      if (inflight) return inflight;

      console.log(`🔍 Fetching documents for employee ID: ${employeeId}...`);
      console.log(`🔍 Employee ID type: ${typeof employeeId}, value: "${employeeId}"`);
      
      // Use paginated approach to handle Supabase's 1000-row limit
      const allDocs: Document[] = [];
      const LIMIT = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
          const { data, error } = await supabase
            .from('employee_documents')
            .select('*')
          .eq('employee_id', employeeId)
            .order('uploaded_at', { ascending: false })
          .range(offset, offset + LIMIT - 1);

          if (error) {
          console.error(`❌ Error fetching documents for employee ${employeeId} (offset: ${offset}):`, error);
            return { documents: [], error: error.message };
          }

        if (data && data.length > 0) {
          console.log(`📄 Fetched ${data.length} documents for ${employeeId} (offset: ${offset})`);
          allDocs.push(...(data as unknown as Document[]));
          
          if (data.length < LIMIT) {
            hasMore = false;
          } else {
            offset += LIMIT;
          }
      } else {
          hasMore = false;
        }
      }

      console.log(`✅ Total documents loaded for ${employeeId}: ${allDocs.length}`);
      
      if (allDocs.length > 0) {
        console.log('📄 Sample documents:', allDocs.slice(0, 3).map(d => ({ 
          id: d.id, 
          employee_id: d.employee_id, 
          file_name: d.file_name 
        })));
      }

      this.employeeDocsCache.set(employeeId, { documents: allDocs, timestamp: Date.now() });
      
      return { documents: allDocs, error: null };
    } catch (error) {
      console.error('❌ Exception in getDocumentsForEmployee:', error);
      return { documents: [], error: 'Failed to fetch documents for employee' };
    }
  }

  // Get document by ID
  static async getDocumentById(documentId: string): Promise<{ data: Document | null; error: string | null }> {
    try {
      console.log(`🔍 Fetching document by ID: ${documentId}...`);
      
      const { data, error } = await supabase
          .from('employee_documents')
          .select('*')
        .eq('id', documentId)
        .single();

          if (error) {
        console.error(`❌ Error fetching document ${documentId}:`, error);
            return { data: null, error: error.message };
          }

      if (!data) {
        console.warn(`⚠️ Document not found: ${documentId}`);
        return { data: null, error: 'Document not found' };
      }

      console.log(`✅ Document found: ${data.file_name}`);
      return { data: data as unknown as Document, error: null };
    } catch (error) {
      console.error('❌ Exception in getDocumentById:', error);
      return { data: null, error: 'Failed to fetch document' };
    }
  }

  // Get company documents with pagination
  static async getCompanyDocuments(companyName?: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      console.log(`🔍 Fetching company documents for: ${companyName}...`);
      
      // Use paginated approach to handle Supabase's 1000-row limit
      const allDocs: Document[] = [];
      const LIMIT = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
            .from('employee_documents')
            .select('*')
          .ilike('file_path', `${companyName}/%`)
            .order('uploaded_at', { ascending: false })
          .range(offset, offset + LIMIT - 1);

          if (error) {
          console.error(`❌ Error fetching company documents for ${companyName} (offset: ${offset}):`, error);
            return { documents: [], error: error.message };
          }

        if (data && data.length > 0) {
          console.log(`📄 Fetched ${data.length} company documents for ${companyName} (offset: ${offset})`);
          allDocs.push(...(data as unknown as Document[]));
          
          if (data.length < LIMIT) {
            hasMore = false;
          } else {
            offset += LIMIT;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Total company documents loaded for ${companyName}: ${allDocs.length}`);
      return { documents: allDocs, error: null };
    } catch (error) {
      console.error('❌ Exception in getCompanyDocuments:', error);
      return { documents: [], error: 'Failed to fetch company documents' };
    }
  }

  // Get all documents with optional filters and pagination
  static async getDocuments(filters?: {
    employee_id?: string;
    company_name?: string;
    document_type?: string;
    is_active?: boolean;
    file_path?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ documents: Document[]; total: number; totalPages: number; page: number; pageSize: number; error: string | null }> {
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('employee_documents')
        .select('*', { count: 'exact' })
        .order('uploaded_at', { ascending: false });

      // Apply search filter
      if (filters?.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        // First, try to find employees with matching names
        const { data: employees } = await supabase
          .from('employee_table')
          .select('employee_id')
          .ilike('name', `%${searchTerm}%`)
          .limit(100);

        const employeeIds = employees?.map(emp => emp.employee_id) || [];

        // Search by file name, employee ID, or employee names (via employee IDs)
        if (employeeIds.length > 0) {
          query = query.or(`file_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%,employee_id.in.(${employeeIds.join(',')})`);
        } else {
          query = query.or(`file_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`);
        }
      }

      // Apply filters
      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.file_path) {
        query = query.ilike('file_path', `${filters.file_path}/%`);
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return {
          documents: [],
          total: 0,
          totalPages: 0,
          page,
          pageSize,
          error: error.message
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        documents: data ? (data as unknown as Document[]) : [],
        total,
        totalPages,
        page,
        pageSize,
        error: null
      };
    } catch (error) {
      return {
        documents: [],
        total: 0,
        totalPages: 0,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 20,
        error: 'Failed to fetch documents'
      };
    }
  }

  // Get document folders (companies and company documents)
  static async getDocumentFolders(useCache = true): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    const startTime = performance.now();
    const cacheKey = 'docs:company-folders';
    
    try {
      // Check cache first with intelligent validation
      if (useCache && this.foldersCache && this.isCacheValid(cacheKey, this.CACHE_DURATIONS.companies)) {
        this.logPerformance('getDocumentFolders-cache-hit', performance.now() - startTime);
        if (process.env.NODE_ENV !== 'production') console.log('⚡ Using cached company folders');
        return { folders: this.foldersCache.folders, error: null };
      }

      // Try server-side materialized view first (if enabled and present)
      const useMV = process.env.NEXT_PUBLIC_USE_DOCS_MV === '1';
      if (useMV) {
        try {
          const { data: mvRows, error: mvError } = await supabase
            .from(this.COMPANY_FOLDERS_VIEW)
            .select('company_prefix, display_name, document_count, last_modified');
          if (!mvError && mvRows && mvRows.length > 0) {
            // 1) Remove test/special folders we don't want to show
            const filtered = (mvRows as any[]).filter(r => r.company_prefix && r.display_name && r.company_prefix !== 'FINAL_TEST');

            // 2) Deduplicate entries that map to the same display name (e.g., EMP_COMPANY_DOCS and Company Documents)
            const groups = new Map<string, any[]>();
            for (const row of filtered) {
              const key = (row.display_name as string).trim();
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key)!.push(row);
            }

            const folders: DocumentFolder[] = [];
            groups.forEach((rows, displayName) => {
              // Choose a canonical prefix for this display name
              let canonical = rows[0];
              // Prefer EMP_COMPANY_DOCS as canonical for Company Documents
              if (displayName === 'Company Documents') {
                const preferred = rows.find(r => r.company_prefix === 'EMP_COMPANY_DOCS');
                if (preferred) canonical = preferred;
              }
              // Aggregate document counts and last modified across duplicates
              const totalCount = rows.reduce((sum, r) => sum + (Number(r.document_count) || 0), 0);
              const lastModified = rows.reduce((maxTs, r) => {
                const ts = r.last_modified ? Date.parse(r.last_modified as string) : 0;
                return Math.max(maxTs, ts);
              }, 0);

              folders.push({
                id: `company-${canonical.company_prefix}`,
                name: displayName,
                type: 'company',
                // Use display name as companyName so downstream mapping can normalize to file-path prefixes
                companyName: displayName,
                documentCount: totalCount,
                lastModified: lastModified > 0 ? new Date(lastModified).toISOString() : new Date().toISOString(),
                // Path uses display name to avoid surfacing raw prefixes like EMP_COMPANY_DOCS
                path: `/${displayName}`
              });
            });

            if (folders.length > 1) {
              this.foldersCache = { folders, timestamp: Date.now() };
              if (process.env.NODE_ENV !== 'production') console.log('⚡ Using materialized view for company folders (deduped)');
              return { folders, error: null };
            }
            if (process.env.NODE_ENV !== 'production') console.log('⚠️  MV returned too few folders; falling back to direct scan');
          }
        } catch (e) {
          // View not available or RLS blocked – silently fallback
        }
      }

      // Fast alternative: Get unique company prefixes directly
      console.log('⚡ Using fast company folders query...');
      
      try {
        // Get unique company prefixes with optimized queries
        console.log('⚡ Using optimized queries for company prefixes...');
        
        const companyPrefixes = new Set<string>();
        
        // First, get the main companies from a general query
        const { data: generalData, error: generalError } = await supabase
          .from('employee_documents')
          .select('file_path')
          .not('file_path', 'is', null)
          .limit(1000);

        if (generalError) {
          console.error('❌ Error fetching general company data:', generalError);
          throw generalError;
        }

        // Extract prefixes from general query
        generalData?.forEach(doc => {
          if (doc.file_path && typeof doc.file_path === 'string') {
            const parts = doc.file_path.split('/');
            if (parts.length > 0 && parts[0]) {
              companyPrefixes.add(parts[0]);
            }
          }
        });

        // Then, specifically check for known companies that might be missing
        const knownCompanies = [
          'ASHBAL AL KHALEEJ',
          'Company Documents', 
          'AL HANA TOURS & TRAVELS'
        ];

        for (const company of knownCompanies) {
          const { data: companyData, error: companyError } = await supabase
            .from('employee_documents')
            .select('file_path')
            .ilike('file_path', `${company}%`)
            .limit(1);

          if (!companyError && companyData && companyData.length > 0) {
            companyPrefixes.add(company);
            console.log(`✅ Found missing company: ${company}`);
          }
        }

        // Remove unwanted prefixes
        companyPrefixes.delete('FINAL_TEST');

        console.log(`🏢 Found ${companyPrefixes.size} company prefixes:`, Array.from(companyPrefixes));
        console.log(`🏢 Company prefixes sorted:`, Array.from(companyPrefixes).sort());
        
        // Debug: Check for specific companies
        const hasAshbal = companyPrefixes.has('ASHBAL AL KHALEEJ');
        const hasCompanyDocs = companyPrefixes.has('Company Documents');
        console.log(`🔍 ASHBAL AL KHALEEJ found: ${hasAshbal}`);
        console.log(`🔍 Company Documents found: ${hasCompanyDocs}`);

        // Create folders from prefixes
        const folders: DocumentFolder[] = [];
        const displayNameMapping: { [key: string]: string } = {
          'AL_ASHBAL_AJMAN': 'AL ASHBAL AJMAN',
          'AL ASHBAL AJMAN': 'AL ASHBAL AJMAN',
          'CUBS': 'CUBS',
          'CUBS_CONTRACTING': 'CUBS CONTRACTING',
          'CUBS CONTRACTING': 'CUBS CONTRACTING',
          'CUBS_TECH': 'CUBS',
          'ASHBAL_AL_KHALEEJ': 'ASHBAL AL KHALEEJ',
          'ASHBAL AL KHALEEJ': 'ASHBAL AL KHALEEJ',
          'FLUID_ENGINEERING': 'FLUID ENGINEERING',
          'RUKIN_AL_ASHBAL': 'RUKIN AL ASHBAL',
          'RUKIN AL ASHBAL': 'RUKIN AL ASHBAL',
          'GOLDEN_CUBS': 'GOLDEN CUBS',
          'GOLDEN CUBS': 'GOLDEN CUBS', // Handle both formats
          'AL_MACEN': 'AL MACEN',
          'AL MACEN': 'AL MACEN',
          'EMP_ALHT': 'AL HANA TOURS & TRAVELS',
          'EMP_COMPANY_DOCS': 'Company Documents',
          'AL HANA TOURS and TRAVELS': 'AL HANA TOURS & TRAVELS',
          'Company Documents': 'Company Documents',
          // Add more mappings for other companies
          'AL_ASHBAL': 'AL ASHBAL',
          'ASHBAL': 'ASHBAL',
          'RUKIN': 'RUKIN',
          'MACEN': 'MACEN'
        };

        // Group by display name with better deduplication
        const groupedFolders = new Map<string, string[]>();
        Array.from(companyPrefixes).forEach(prefix => {
          let displayName = displayNameMapping[prefix];
          
          // If no mapping found, create a clean display name
          if (!displayName) {
            displayName = prefix.replace(/_/g, ' ').trim();
          }
          
          // Normalize the display name to prevent duplicates
          const normalizedName = displayName.toUpperCase().trim();
          
          if (!groupedFolders.has(normalizedName)) {
            groupedFolders.set(normalizedName, []);
          }
          groupedFolders.get(normalizedName)!.push(prefix);
        });

        // Create final folders
        groupedFolders.forEach((prefixes, normalizedName) => {
          // Get the original display name from the first prefix
          const firstPrefix = prefixes[0];
          const originalDisplayName = displayNameMapping[firstPrefix] || firstPrefix.replace(/_/g, ' ').trim();
          
          folders.push({
            id: `company-${firstPrefix}`,
            name: originalDisplayName,
            type: 'company',
            companyName: originalDisplayName,
            documentCount: 0, // We'll get this later if needed
            lastModified: new Date().toISOString(),
            path: `/${originalDisplayName}`
          });
        });

        // Cache the result with timestamp
        this.foldersCache = { folders, timestamp: Date.now() };
        this.cacheTimestamps.set(cacheKey, Date.now());
        console.log(`✅ Created ${folders.length} company folders in ${performance.now() - startTime}ms`);
        console.log(`📁 Final folders:`, folders.map(f => f.name));
        
        return { folders, error: null };
      } catch (error) {
        console.error('❌ Error in fast company folders query:', error);
        throw error;
      }
    } catch (error) {
      this.isCurrentlyFetching = false;
      this.fetchPromise = null;
      console.error('❌ Error in getDocumentFolders:', error);
      
      // Return fallback data to prevent infinite loading
      const fallbackFolders: DocumentFolder[] = [
        {
          id: 'company-CUBS',
          name: 'CUBS',
          type: 'company',
          companyName: 'CUBS',
          documentCount: 0,
          lastModified: new Date().toISOString(),
          path: '/CUBS'
        },
        {
          id: 'company-GOLDEN_CUBS',
          name: 'GOLDEN CUBS',
          type: 'company',
          companyName: 'GOLDEN CUBS',
          documentCount: 0,
          lastModified: new Date().toISOString(),
          path: '/GOLDEN CUBS'
        },
        {
          id: 'company-EMP_COMPANY_DOCS',
          name: 'Company Documents',
          type: 'company',
          companyName: 'Company Documents',
          documentCount: 0,
          lastModified: new Date().toISOString(),
          path: '/Company Documents'
        }
      ];
      
      return { folders: fallbackFolders, error: 'Using fallback data due to timeout' };
    }
  }

  // Internal method to build folders
  private static async _buildFolders(): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      // Add timeout protection for document fetching
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Document fetch timeout')), 15000)
      );

      // Get document counts for each company - fetch ALL documents using pagination with timeout
      const fetchPromise = this.fetchAllDocuments();
      const { documents: allDocuments, error: docsError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (docsError) {
        console.error('❌ Error fetching documents:', docsError);
        // Return fallback data instead of empty array
        return { 
          folders: [
            {
              id: 'company-CUBS',
              name: 'CUBS',
              type: 'company',
              companyName: 'CUBS',
              documentCount: 0,
              lastModified: new Date().toISOString(),
              path: '/CUBS'
            },
            {
              id: 'company-GOLDEN_CUBS',
              name: 'GOLDEN CUBS',
              type: 'company',
              companyName: 'GOLDEN CUBS',
              documentCount: 0,
              lastModified: new Date().toISOString(),
              path: '/GOLDEN CUBS'
            },
            {
              id: 'company-CUBS_CONTRACTING',
              name: 'CUBS CONTRACTING',
              type: 'company',
              companyName: 'CUBS CONTRACTING',
              documentCount: 0,
              lastModified: new Date().toISOString(),
              path: '/CUBS CONTRACTING'
            }
          ], 
          error: null 
        };
      }

      if (process.env.NODE_ENV !== 'production') console.log(`📄 Found ${allDocuments?.length || 0} total documents (paginated)`);

      // Extract unique company prefixes from actual file paths
      const companyPrefixes = new Set<string>();
      allDocuments?.forEach((doc: any) => {
        if (doc.file_path && typeof doc.file_path === 'string') {
          const parts = doc.file_path.split('/');
          if (parts.length > 0 && parts[0]) {
            companyPrefixes.add(parts[0]);
          }
        }
      });

      // Remove unwanted folders like FINAL_TEST
      companyPrefixes.delete('FINAL_TEST');

      if (process.env.NODE_ENV !== 'production') console.log(`🏢 Found ${companyPrefixes.size} unique company prefixes in file paths:`, Array.from(companyPrefixes).sort());

      // Create company folders based on actual file paths
      const companyFolders: DocumentFolder[] = [];
      
      // Create mapping from file path prefixes to display names (including new user-friendly paths)
      const displayNameMapping: { [key: string]: string } = {
        // Legacy folder mappings (for existing documents)
        'AL_ASHBAL_AJMAN': 'AL ASHBAL AJMAN',
        'CUBS': 'CUBS',
        'CUBS CONTRACTING': 'CUBS CONTRACTING',
        'CUBS TECH': 'CUBS',
        'ASHBAL_AL_KHALEEJ': 'ASHBAL AL KHALEEJ',
        'FLUID_ENGINEERING': 'FLUID',
        'RUKIN_AL_ASHBAL': 'RUKIN',
        'GOLDEN_CUBS': 'GOLDEN CUBS',
        'AL MACEN': 'AL MACEN',
        'EMP_ALHT': 'AL HANA TOURS & TRAVELS',
        'EMP_COMPANY_DOCS': 'Company Documents',
        // New user-friendly folder mappings (for new uploads)
        'AL HANA TOURS and TRAVELS': 'AL HANA TOURS & TRAVELS',
        'Company Documents': 'Company Documents'
      };
      
      // Consolidate duplicate display names
      const consolidatedFolders = new Map<string, { 
        displayName: string; 
        prefixes: string[]; 
        documents: any[]; 
        lastModified: number;
      }>();
      
      for (const prefix of Array.from(companyPrefixes).sort()) {
        if (prefix === 'FINAL_TEST') continue; // skip test folders
        const displayName = displayNameMapping[prefix] || prefix.replace(/_/g, ' ');
        const companyDocs = allDocuments?.filter((doc: any) => 
          doc.file_path && typeof doc.file_path === 'string' && doc.file_path.startsWith(prefix + '/')
        ) || [];
        // Safely compute lastModified with fallbacks
        const times: number[] = [];
        for (const d of companyDocs) {
          const t = d && (d as any).uploaded_at ? Date.parse((d as any).uploaded_at as string) : NaN;
          if (!Number.isNaN(t)) times.push(t);
        }
        const lastModified = times.length > 0 ? Math.max(...times) : Date.now();
        if (consolidatedFolders.has(displayName)) {
          const existing = consolidatedFolders.get(displayName)!;
          existing.prefixes.push(prefix);
          existing.documents.push(...companyDocs);
          existing.lastModified = Math.max(existing.lastModified, lastModified);
        } else {
          consolidatedFolders.set(displayName, {
            displayName,
            prefixes: [prefix],
            documents: companyDocs,
            lastModified
          });
        }
      }
      
      for (const [displayName, data] of Array.from(consolidatedFolders.entries())) {
        // For Company Documents, force canonical to display name and avoid nested subfolder entry duplication
        const isCompanyDocs = displayName === 'Company Documents';
        const primaryPrefix = isCompanyDocs ? 'EMP_COMPANY_DOCS' : data.prefixes[0];
        companyFolders.push({
          id: `company-${primaryPrefix}`,
          name: displayName,
          type: 'company',
          // Use display name in companyName so downstream routing uses the friendly label
          companyName: displayName,
          documentCount: data.documents.length,
          lastModified: new Date(data.lastModified).toISOString(),
          // Use display name in path for stable, friendly routing
          path: `/${displayName}`
        });
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`📁 Created ${companyFolders.length} company folders`);
        console.log('🔍 Company folders:', companyFolders.map(f => `${f.name} (${f.documentCount} docs)`));
      }

      // Update cache
      this.foldersCache = {
        folders: companyFolders,
        timestamp: Date.now()
      };

      if (process.env.NODE_ENV !== 'production') console.log(`📁 Processed ${companyFolders.length} folders exactly as they appear in Backblaze`);
      return { folders: companyFolders, error: null };
    } catch (error) {
      console.error('❌ Error in _buildFolders:', error);
      return { folders: [], error: 'Failed to fetch document folders' };
    }
  }



  private static processCompanyData(companyData: Map<string, { count: number; lastModified: string; employees: Set<string> }>): { folders: DocumentFolder[]; error: string | null } {
    try {
      const folders: DocumentFolder[] = [];

      companyData.forEach((data, companyName) => {
        // Handle special case for Company Documents and AL HANA TOURS & TRAVELS
        let displayName;
        if (companyName === 'Company Documents') {
          displayName = 'Company Documents';
        } else if (companyName === 'AL HANA TOURS & TRAVELS') {
          displayName = 'AL HANA TOURS & TRAVELS';
        } else {
          displayName = companyName.replace(/_/g, ' ');
        }
        
        folders.push({
          id: companyName,
          name: displayName,
          type: 'company' as const,
          companyName,
          documentCount: data.count,
          lastModified: parseInt(data.lastModified) > 0 ? new Date(parseInt(data.lastModified)).toISOString() : new Date().toISOString(),
          path: `/company/${companyName}`
        });
      });

      return { folders, error: null };
    } catch (error) {
      return { folders: [], error: 'Failed to process company data' };
    }
  }

  // Get documents for a specific employee or company documents - FAST OPTIMIZED
  static async getEmployeeDocuments(companyName: string, employeeId: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      console.log(`⚡ FAST: Fetching documents for: ${companyName}/${employeeId}`);

      // Check cache first
      const cacheKey = `${companyName}-${employeeId}`;
      const cached = this.employeeDocsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATIONS.documents) {
        console.log('✅ Cache hit for employee documents');
        return { documents: cached.documents, error: null };
      }

      // Special handling for top-level Company Documents (canonical)
      if (companyName === 'Company Documents') {
        const { data, error } = await supabase
          .from('employee_documents')
          .select('*')
          .or('employee_id.eq.COMPANY_DOCS,file_path.ilike.EMP_COMPANY_DOCS/%')
          .order('uploaded_at', { ascending: false })
          .limit(500); // Add limit for performance
        if (error) {
          return { documents: [], error: error.message };
        }
        return { documents: (data || []) as unknown as Document[], error: null };
      }

      // FAST: Single optimized query with multiple conditions
      const { data: documents, error } = await supabase
        .from('employee_documents')
        .select('*')
        .or(`employee_id.eq.${employeeId},file_path.ilike.%${employeeId}%,file_path.ilike.${companyName}/${employeeId}%`)
        .order('uploaded_at', { ascending: false })
        .limit(500); // Reasonable limit for employee documents

      if (error) {
        console.error('❌ Error in fast employee documents query:', error);
        return { documents: [], error: error.message };
      }

      if (!documents || documents.length === 0) {
        return { documents: [], error: 'No documents found for this employee' };
      }

      // Cache the result
      this.employeeDocsCache.set(cacheKey, { 
        documents: documents as unknown as Document[], 
        timestamp: Date.now() 
      });

      console.log(`✅ Found ${documents.length} documents for employee ${employeeId}`);
      return { documents: documents as unknown as Document[], error: null };
    } catch (error) {
      console.error('❌ Exception in getEmployeeDocuments:', error);
      return { documents: [], error: 'Failed to fetch employee documents' };
    }
  }

  // Search employee folders across all companies
  static async searchEmployeeFolders(searchTerm: string, limit: number = 20): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return { folders: [], error: null };
      }

      console.log(`🔍 Searching employee folders for: "${searchTerm}"`);

      // Try RPC function first, fallback to manual query if RPC fails
      try {
        const { data, error } = await supabase.rpc('search_employee_folders', {
          search_term: searchTerm.trim(),
          limit_count: limit
        });

        if (error) {
          console.warn('⚠️ RPC function failed, falling back to manual query:', error.message);
          throw error; // This will trigger the fallback
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log('❌ No employee folders found matching search term');
          return { folders: [], error: null };
        }

        console.log(`✅ Found ${data.length} employee folders matching search via RPC`);

        // Convert RPC result to DocumentFolder format
        const folders: DocumentFolder[] = data.map((item: any) => {
          const displayName = this.resolveEmployeeDisplayName(item.employee_id, item.employee_name);

          return {
            id: `emp-${item.employee_id}`,
            name: displayName,
            type: 'employee' as const,
            companyName: item.company_name,
            employeeId: item.employee_id,
            employeeName: displayName,
            documentCount: item.document_count || 0,
            lastModified: item.last_modified || new Date().toISOString(),
            path: `${item.company_name}/${item.employee_id}`
          };
        });

        console.log(`✅ Created ${folders.length} employee folders`);
        return { folders, error: null };

      } catch (rpcError) {
        console.log('🔄 Falling back to manual employee folder search...');
        
        // Fallback: Manual query without RPC
        const { data: employees, error: empError } = await supabase
          .from('employee_table')
          .select('employee_id, name, company_name')
          .or(`name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
          .limit(100);

        if (empError) {
          console.error('❌ Error searching employees:', empError);
          return { folders: [], error: empError.message };
        }

        if (!employees || employees.length === 0) {
          console.log('❌ No employees found matching search term');
          return { folders: [], error: null };
        }

        console.log(`✅ Found ${employees.length} employees matching search via fallback`);

        // Get document counts for these employees
        const employeeIds = employees.map(emp => emp.employee_id);
        const { data: docCounts, error: docError } = await supabase
          .from('employee_documents')
          .select('employee_id, created_at')
          .in('employee_id', employeeIds)
          .order('created_at', { ascending: false });

        if (docError) {
          console.error('❌ Error fetching document counts:', docError);
        }

        // Create document count map
        const docCountMap = new Map<string, { count: number; lastModified: string }>();
        (docCounts || []).forEach(doc => {
          const employeeId = doc.employee_id as string;
          const existing = docCountMap.get(employeeId);
          if (existing) {
            existing.count++;
            const docDate = new Date(doc.created_at as string).getTime();
            const existingDate = new Date(existing.lastModified).getTime();
            if (docDate > existingDate) {
              existing.lastModified = doc.created_at as string;
            }
          } else {
            docCountMap.set(employeeId, {
              count: 1,
              lastModified: doc.created_at as string
            });
          }
        });

        // Create folder objects
        const folders: DocumentFolder[] = employees.map(employee => {
          const docInfo = docCountMap.get(employee.employee_id as string) || { count: 0, lastModified: new Date().toISOString() };
          const displayName = this.resolveEmployeeDisplayName(employee.employee_id as string, employee.name as string);

          return {
            id: `emp-${employee.employee_id}`,
            name: displayName,
            type: 'employee' as const,
            companyName: employee.company_name as string,
            employeeId: employee.employee_id as string,
            employeeName: displayName,
            documentCount: docInfo.count,
            lastModified: docInfo.lastModified,
            path: `${employee.company_name}/${employee.employee_id}`
          };
        });

        // Sort by document count (most documents first) and limit results
        const sortedFolders = folders
          .sort((a, b) => b.documentCount - a.documentCount)
          .slice(0, limit);

        console.log(`✅ Created ${sortedFolders.length} employee folders via fallback`);
        return { folders: sortedFolders, error: null };
      }

    } catch (error) {
      console.error('❌ Exception in searchEmployeeFolders:', error);
      return { folders: [], error: 'Failed to search employee folders' };
    }
  }

  // Get search suggestions for autocomplete
  static async getSearchSuggestions(searchTerm: string, limit: number = 10): Promise<{ suggestions: any[]; error: string | null }> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { suggestions: [], error: null };
      }

      console.log(`🔍 Getting search suggestions for: "${searchTerm}"`);

      // Get employee suggestions
      const { data: employees, error: empError } = await supabase
        .from('employee_table')
        .select('employee_id, name, company_name')
        .or(`name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`)
        .limit(limit);

      if (empError) {
        console.error('❌ Error fetching employee suggestions:', empError);
        return { suggestions: [], error: empError.message };
      }

      // Get company suggestions from unique company names
      const { data: companies, error: compError } = await supabase
        .from('employee_table')
        .select('company_name')
        .ilike('company_name', `%${searchTerm}%`)
        .limit(limit);

      if (compError) {
        console.error('❌ Error fetching company suggestions:', compError);
        return { suggestions: [], error: compError.message };
      }

      // Get document file name suggestions
      const { data: documents, error: docError } = await supabase
        .from('employee_documents')
        .select('file_name, employee_id')
        .ilike('file_name', `%${searchTerm}%`)
        .limit(limit);

      if (docError) {
        console.error('❌ Error fetching document suggestions:', docError);
        return { suggestions: [], error: docError.message };
      }

      // Combine and format suggestions
      const suggestions: any[] = [];

      // Add employee suggestions
      (employees || []).forEach(emp => {
        suggestions.push({
          type: 'employee',
          id: emp.employee_id,
          name: emp.name,
          company: emp.company_name,
          displayText: `${emp.name} (${emp.company_name})`,
          searchText: `${emp.name} ${emp.company_name} ${emp.employee_id}`
        });
      });

      // Add unique company suggestions
      const uniqueCompanies = [...new Set((companies || []).map(c => c.company_name))];
      uniqueCompanies.forEach(company => {
        suggestions.push({
          type: 'company',
          id: company,
          name: company,
          company: company,
          displayText: company,
          searchText: company
        });
      });

      // Add document suggestions
      (documents || []).forEach(doc => {
        suggestions.push({
          type: 'document',
          id: doc.file_name,
          name: doc.file_name,
          company: '',
          displayText: doc.file_name,
          searchText: doc.file_name
        });
      });

      // Remove duplicates and limit results
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
        index === self.findIndex(s => s.displayText === suggestion.displayText)
      ).slice(0, limit);

      console.log(`✅ Found ${uniqueSuggestions.length} search suggestions`);
      return { suggestions: uniqueSuggestions, error: null };

    } catch (error) {
      console.error('❌ Error in getSearchSuggestions:', error);
      return { suggestions: [], error: 'Failed to get search suggestions' };
    }
  }

  // New function to search documents with employee names using RPC
  static async searchDocuments(searchTerm: string): Promise<{ documents: any[]; error: string | null }> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return { documents: [], error: null };
      }

      console.log(`🔍 Searching documents for: "${searchTerm}"`);

      // Try RPC function first, fallback to manual query if RPC fails
      try {
        const { data, error } = await supabase.rpc('search_documents_and_employees', {
          search_term: searchTerm.trim()
        });

        if (error) {
          console.warn('⚠️ RPC function failed, falling back to manual query:', error.message);
          throw error; // This will trigger the fallback
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log('❌ No documents found matching search term');
          return { documents: [], error: null };
        }

        console.log(`✅ Found ${data.length} documents matching search via RPC`);
        return { documents: data, error: null };

      } catch (rpcError) {
        console.log('🔄 Falling back to manual search query...');
        
        // Fallback: Manual query without RPC
        const { data: documents, error: docError } = await supabase
          .from('employee_documents')
          .select(`
            *,
            employee_table!inner(name, company_name)
          `)
          .or(`file_name.ilike.%${searchTerm}%,employee_table.name.ilike.%${searchTerm}%,employee_table.employee_id.ilike.%${searchTerm}%,employee_table.company_name.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false });

        if (docError) {
          console.error('❌ Error in fallback search:', docError);
          return { documents: [], error: docError.message };
        }

        if (!documents || documents.length === 0) {
          console.log('❌ No documents found matching search term');
          return { documents: [], error: null };
        }

        // Transform the data to match RPC format
        const transformedDocuments = documents.map((doc: any) => ({
          ...doc,
          employee_name: doc.employee_table?.name,
          company_name: doc.employee_table?.company_name
        }));

        console.log(`✅ Found ${transformedDocuments.length} documents matching search via fallback`);
        return { documents: transformedDocuments, error: null };
      }

    } catch (error) {
      console.error('❌ Error in searchDocuments:', error);
      return { documents: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get employee folders for a specific company with real document data - PERFORMANCE OPTIMIZED
  static async getEmployeeFolders(companyName: string, useCache = true): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      if (process.env.NODE_ENV !== 'production') console.log(`👥 Getting employee folders for company: ${companyName}`);
      
      // Create mapping from display names to file path company names
      const companyNameMapping: { [key: string]: string } = {
        'AL ASHBAL AJMAN': 'AL ASHBAL AJMAN',
        'CUBS': 'CUBS',
        'CUBS CONTRACTING': 'CUBS CONTRACTING',
        'CUBS TECH': 'CUBS',
        'ASHBAL AL KHALEEJ': 'ASHBAL_AL_KHALEEJ',
        'FLUID': 'FLUID_ENGINEERING',
        'RUKIN': 'RUKIN_AL_ASHBAL',
        'GOLDEN CUBS': 'GOLDEN_CUBS',
        'AL MACEN': 'AL MACEN',
        // Canonicalize to '&' variant for uploads
        'AL HANA TOURS & TRAVELS': 'AL HANA TOURS & TRAVELS',
        // Legacy mapping
        'Company Documents': 'EMP_COMPANY_DOCS',
        // New user-friendly paths
        'AL HANA TOURS and TRAVELS': 'AL HANA TOURS & TRAVELS'
      };
      
      console.log('🔍 Company name mapping for:', companyName, '→', companyNameMapping[companyName] || companyName);
      
      // Get the corresponding file path company name
      const filePathCompanyName = companyNameMapping[companyName] || companyName;
      if (process.env.NODE_ENV !== 'production') console.log(`🔍 Using file path company name: ${filePathCompanyName} for display name: ${companyName}`);
      console.log('🔍 Company name mapping:', { displayName: companyName, filePathName: filePathCompanyName });
      
      // Special handling for Company Documents - show files directly, not employee folders
      if (companyName === 'Company Documents') {
        if (process.env.NODE_ENV !== 'production') console.log('📁 Company Documents: Returning empty folders array (files should be shown directly)');
        return { folders: [], error: null };
      }
      
      // Check cache - extended duration for better performance
      const cached = this.employeeFoldersCache.get(filePathCompanyName);
      if (useCache && cached && Date.now() - cached.timestamp < this.CACHE_DURATIONS.employees * 2) { // Extended cache duration
        return { folders: cached.folders, error: null };
      }
      const inflight = this.employeeFoldersInflight.get(filePathCompanyName);
      if (inflight) return inflight;

      // Try server-side materialized view first (if enabled and present)
      const useMV = process.env.NEXT_PUBLIC_USE_DOCS_MV === '1';
      if (useMV) {
        try {
          const { data: mvRows, error: mvError } = await supabase
            .from(this.EMPLOYEE_COUNTS_VIEW)
            .select('employee_id, employee_name, document_count, last_modified')
            .eq('company_prefix', filePathCompanyName);
          if (!mvError && mvRows && mvRows.length > 0) {
            const folders: DocumentFolder[] = (mvRows as any[])
              .filter(r => r.employee_id)
              .map(r => ({
                id: `emp-${r.employee_id}`,
                name: this.resolveEmployeeDisplayName(r.employee_id as string, r.employee_name as string),
                type: 'employee' as const,
                companyName,
                employeeId: r.employee_id as string,
                employeeName: this.resolveEmployeeDisplayName(r.employee_id as string, r.employee_name as string),
                documentCount: Number(r.document_count) || 0,
                lastModified: r.last_modified ? new Date(r.last_modified as string).toISOString() : new Date().toISOString(),
                path: `${companyName}/${r.employee_id}`
              }));
            this.employeeFoldersCache.set(filePathCompanyName, { folders, timestamp: Date.now() });
            if (process.env.NODE_ENV !== 'production') console.log('⚡ Using materialized view for employee folders');
            return { folders, error: null };
          }
        } catch (e) {
          // View not available; fallback below
        }
      }

      // FAST ALTERNATIVE: Direct employee folder query (bypass document fetching)
      const run = async (): Promise<{ folders: DocumentFolder[]; error: string | null }> => {
        console.log('⚡ Using FAST employee folder query for:', filePathCompanyName);
        
        try {
          // Direct query to get employee folders with counts - MUCH FASTER
          const { data: employeeData, error: employeeError } = await supabase
            .from('employee_documents')
            .select('employee_id, file_path, uploaded_at')
            .ilike('file_path', `${filePathCompanyName}/%`)
            .order('uploaded_at', { ascending: false })
            .limit(2000); // Reasonable limit for folder creation

          if (employeeError) {
            console.error('❌ Error in fast employee query:', employeeError);
            return { folders: [], error: employeeError.message };
          }

          if (!employeeData || employeeData.length === 0) {
            console.log('❌ No documents found for company:', filePathCompanyName);
          this.employeeFoldersCache.set(filePathCompanyName, { folders: [], timestamp: Date.now() });
          return { folders: [], error: null };
        }

          // Extract unique employee IDs and their latest document info
          const employeeMap = new Map<string, { count: number; lastModified: string; filePath: string }>();
          
          employeeData.forEach(doc => {
            const employeeId = doc.employee_id as string;
            if (!employeeId) return;
            
            const existing = employeeMap.get(employeeId);
            if (existing) {
              existing.count++;
              // Keep the most recent upload date
              const docDate = new Date((doc as any).uploaded_at || new Date()).getTime();
              const existingDate = new Date(existing.lastModified).getTime();
              if (docDate > existingDate) {
                existing.lastModified = (doc as any).uploaded_at || new Date().toISOString();
                existing.filePath = (doc as any).file_path || '';
              }
            } else {
              employeeMap.set(employeeId, {
                count: 1,
                lastModified: (doc as any).uploaded_at || new Date().toISOString(),
                filePath: (doc as any).file_path || ''
              });
            }
          });

          const employeeIds = Array.from(employeeMap.keys());
          console.log(`👥 Found ${employeeIds.length} unique employee IDs from fast query`);

        if (employeeIds.length === 0) {
          this.employeeFoldersCache.set(filePathCompanyName, { folders: [], timestamp: Date.now() });
          return { folders: [], error: null };
        }

          // Get employee names efficiently
          const { data: employeeNames, error: nameError } = await supabase
             .from('employee_table')
             .select('employee_id, name')
            .in('employee_id', employeeIds);

          if (nameError) {
            console.error('❌ Error fetching employee names:', nameError);
            return { folders: [], error: nameError.message };
          }

          // Create name lookup map
          const nameMap = new Map<string, string>();
          (employeeNames || []).forEach(emp => {
            nameMap.set(emp.employee_id as string, emp.name as string);
          });

          // Create folders
          const folders: DocumentFolder[] = [];
          employeeMap.forEach((info, employeeId) => {
            const dbName = nameMap.get(employeeId) || '';
            const displayName = this.resolveEmployeeDisplayName(employeeId, dbName);
            
            folders.push({
          id: `emp-${employeeId}`,
              name: displayName,
          type: 'employee' as const,
              companyName,
              employeeId,
              employeeName: displayName,
              documentCount: info.count,
              lastModified: info.lastModified,
          path: `${companyName}/${employeeId}`
            });
          });
        
          console.log(`✅ Created ${folders.length} employee folders in fast query`);
        this.employeeFoldersCache.set(filePathCompanyName, { folders, timestamp: Date.now() });
        return { folders, error: null };
        } catch (error) {
          console.error('❌ Error in fast employee folder creation:', error);
          return { folders: [], error: 'Failed to create employee folders' };
        }
      };
      const promise = run().finally(() => {
        this.employeeFoldersInflight.delete(filePathCompanyName);
      });
      this.employeeFoldersInflight.set(filePathCompanyName, promise);
      return promise;
    } catch (error) {
      console.error('❌ Exception in getEmployeeFolders:', error);
      return { folders: [], error: 'Failed to fetch employee folders' };
    }
  }

  // Enhanced employee name resolution with proper mapping
  private static resolveEmployeeDisplayName(employeeId: string, dbName?: string, pathName?: string): string {
    // 1. Try database lookup first
    if (dbName && dbName.trim().length > 0) {
      return dbName.trim();
    }

    // 2. Try path-derived name
    if (pathName && pathName.trim().length > 0) {
      return pathName.trim();
    }

    // 3. Enhanced ID to name conversion for specific patterns
    const resolvedName = this.convertEmployeeIdToName(employeeId);
    if (resolvedName !== employeeId) {
      return resolvedName;
    }

    // 4. Format the employee ID to be more readable as final fallback
    return this.formatEmployeeId(employeeId);
  }

  // Convert employee IDs to proper names based on patterns
  private static convertEmployeeIdToName(employeeId: string): string {
    // Handle specific company patterns
    if (employeeId.startsWith('AL_ASHBAL') || employeeId.startsWith('AL ASHBAL')) {
      // Extract number and map to known employees
      const number = employeeId
        .replace('AL_ASHBAL', '')
        .replace('AL ASHBAL', '')
        .replace(/[^0-9]/g, '')
        .trim();
      const employeeMap: { [key: string]: string } = {
        '001': 'MUFAD TALIKDER',
        '004': 'ABDUR ROHIM',
        '005': 'MANIK JAMDER',
        '006': 'MD SOMED MIAH',
        '007': 'MD SULAIMAN MD SHAHJAHAN',
        '008': 'PEAR HUSSAIN',
        '009': 'MD KAMALUDDIN',
        '010': 'MD MASUM',
        '011': 'MD JUNAYED MIA',
        '012': 'MD NASIR UDDIN',
        '013': 'SHARIF DEWAN',
        '014': 'MONGAL BADSHA',
        '015': 'SIRAZUL ISLAM',
        '016': 'SAJI CHANDRAN',
        '017': 'ALLEN PRAKASH',
        '018': 'SHAMSH ALAM',
        '019': 'SHYAM BABU',
        '020': 'ANARUDH SAH',
        '021': 'SUNIL KUMAR',
        '022': 'THAMEEM ANSARI',
        '023': 'AHSANUL KARIM',
        '024': 'BABLU KUMAR',
        '025': 'ANCIL XAVIER',
        '026': 'ASGAR HUSSAIN',
        '027': 'BIJU KUMAR VIJAYAN GANGADHARAN',
        '028': 'VINOD KUMAR GUPTA',
        '029': 'BIJU SIVANANDAN',
        '030': 'DHANAPAL KALIYAN',
        '031': 'ABDUR SATTAR GAZI',
        '032': 'ISMAIL KHAN',
        '033': 'ALI AHMED',
        '034': 'JAY NARAYAN',
        '035': 'MD KAMALUDDIN',
        '036': 'MD MASUM',
        '037': 'MISHAN RAI',
        '038': 'NASIR ULLAH',
        '039': 'PRINCE VARGHESE',
        '040': 'RAM EKBAL',
        '041': 'LIJO DASAN',
        '042': 'RAN BAHADUR',
        '043': 'RINJO JOSE M',
        '044': 'SHALALUDDIN',
        '045': 'ABU BAKKAR',
        '046': 'AYYAKANNU',
        '047': 'CHANDAN DAS',
        '048': 'GINI SREENIVAS',
        '049': 'MOHAMMAD EKRAMUL',
        '050': 'MOHAMMED SAHADAT',
        '051': 'MURUGANADHAM',
        '052': 'NUR HOSSAIN',
        '053': 'RAHUL KUMAR',
        '054': 'RANJIT KUMAR',
        '055': 'SABEESH BABU',
        '056': 'SABU THANKACHAN',
        '057': 'SONY ARATTUKULAM',
        '058': 'SUBHASH GOPALAN',
        '059': 'SUDHEESH SURENDRAN',
        '060': 'VINOD KUMAR BAHADUR',
        '061': 'VISHAVANATHAN',
        '062': 'BAKTA BAHADUR',
        '063': 'BENESHA'
      };
      
      if (employeeMap[number]) {
        return employeeMap[number];
      }
    }

    // Handle GOLDEN_CUBS patterns
    if (employeeId.startsWith('GOLDEN_CUBS_') || employeeId.startsWith('GOLDEN CUBS ')) {
      const name = employeeId
        .replace('GOLDEN_CUBS_', '')
        .replace('GOLDEN CUBS ', '')
        .trim();
      if (name) {
        return name.replace(/_/g, ' ');
      }
    }

    // Handle FLUID_ENGINEERING patterns
    if (employeeId.startsWith('FLUID_ENGINEERING_') || employeeId.startsWith('FLUID ENGINEERING ')) {
      const name = employeeId
        .replace('FLUID_ENGINEERING_', '')
        .replace('FLUID ENGINEERING ', '')
        .trim();
      if (name) {
        return name.replace(/_/g, ' ');
      }
    }

    // Return original ID if no pattern matches
    return employeeId;
  }

  // Format employee ID to be more readable
  private static formatEmployeeId(employeeId: string): string {
    // Remove common prefixes (underscore or space variants) and format
    let formatted = employeeId
      .replace(/^((AL[ _]ASHBAL)|(GOLDEN[ _]CUBS)|(FLUID[ _]ENGINEERING)|(CUBS)|(ASHBAL[ _]AL[ _]KHALEEJ)|(RUKIN[ _]AL[ _]ASHBAL)|(CUBS[ _]TECH)|(AL[ _]MACEN)|(AL[ _]HANA[ _]TOURS(?:[ _]AND)?[ _]TRAVELS))[ _]/i, '')
      .replace(/_/g, ' ')
      .trim();

    // If it's still just the ID, try to make it look like a name
    if (formatted === employeeId) {
      // Split by common separators and capitalize
      const parts = employeeId.split(/[ _-]/);
      if (parts.length > 1) {
        return parts.map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ');
      }
    }

    return formatted;
  }

  // Upload a new document
  static async uploadDocument(
    file: File,
    uploadData: UploadDocumentData
  ): Promise<{ document: Document | null; error: string | null }> {
    try {
      // Import BackblazeService dynamically to avoid SSR issues
      const { BackblazeService } = await import('./backblaze');

      // Extract company and employee names from file path for better organization
      const pathParts = uploadData.file_path.split('/');
      // For AL HANA TOURS, force canonical display name to '&' variant for consistency
      let companyName = pathParts[0] || 'Unknown';
      if (companyName === 'AL HANA TOURS and TRAVELS' || companyName === 'AL HANA TOURS AND TRAVELS') {
        companyName = 'AL HANA TOURS & TRAVELS';
      }
      const employeeName = pathParts[1] || 'Unknown';

      // Upload file to Backblaze B2
      const uploadResult = await BackblazeService.uploadFile(file, {
        fileName: uploadData.file_name,
        fileSize: uploadData.file_size,
        mimeType: file.type,
        companyName,
        employeeName,
        documentType: uploadData.document_type
      });

      if (!uploadResult.success) {
        return { document: null, error: uploadResult.error || 'Failed to upload file' };
      }

      // Verify file exists in Backblaze before saving to database
      try {
        const fileExists = await BackblazeService.fileExists(uploadData.file_path);
        if (!fileExists) {
          console.error('❌ File upload verification failed: File not found in Backblaze');
          return { document: null, error: 'File upload verification failed' };
        }
        console.log('✅ File upload verified in Backblaze');
      } catch (verifyError) {
        console.error('❌ File upload verification error:', verifyError);
        return { document: null, error: 'File upload verification failed' };
      }

      // Save document metadata to Supabase using the actual fileKey returned by Backblaze
      const { data: document, error: dbError } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: uploadData.employee_id,
          document_type: uploadData.document_type,
          file_name: uploadData.file_name,
          file_url: uploadResult.fileUrl || '',
          file_size: uploadData.file_size,
          file_path: uploadResult.fileKey || uploadData.file_path,
          file_type: uploadData.file_type,
          mime_type: file.type,
          notes: uploadData.notes,
          is_active: true
        })
        .select()
        .single();

      if (dbError) {
        // If database insert fails, try to delete the uploaded file
        try {
          await BackblazeService.deleteFile(uploadData.file_path);
        } catch (deleteError) {
          console.error('Failed to delete file after database error:', deleteError);
        }
        return { document: null, error: dbError.message };
      }

      console.log(`✅ Document uploaded successfully: ${uploadData.file_name}`);
      
      // Intelligent cache invalidation after upload
      const employeeId = uploadData.employee_id;
      
      // Clear relevant caches
      this.invalidateCache('folders');
      if (companyName) {
        this.invalidateCache('company', companyName);
      }
      if (employeeId) {
        this.invalidateCache('employee', undefined, String(employeeId));
      }
      
      return { document: document as unknown as Document, error: null };
    } catch (error) {
      console.error('❌ Error in uploadDocument:', error);
      return { document: null, error: 'Failed to upload document' };
    }
  }

  // Delete a document
  static async deleteDocument(documentId: string): Promise<{ error: string | null }> {
    try {
      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        return { error: fetchError.message };
      }

      // Import BackblazeService dynamically to avoid SSR issues
      const { BackblazeService } = await import('./backblaze');

      // Extract file key from file_path for Backblaze deletion
      if (document && document.file_path && typeof document.file_path === 'string') {
        try {
          await BackblazeService.deleteFile(document.file_path);
        } catch (backblazeError) {
          console.error('Failed to delete from Backblaze:', backblazeError);
          // If B2 delete fails, abort to avoid orphaning metadata inconsistency
          return { error: 'Failed to delete file from Backblaze' };
        }
      }

      // Delete metadata from Supabase
      const { error: deleteError } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      // Intelligent cache invalidation after delete
      if (document) {
        const pathParts = (document as any).file_path?.split?.('/') || [];
        const companyName = pathParts[0];
        const employeeId = document.employee_id;
        
        // Clear relevant caches
        this.invalidateCache('folders');
        if (companyName) {
          this.invalidateCache('company', companyName);
        }
        if (employeeId) {
          this.invalidateCache('employee', undefined, String(employeeId));
        }
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to delete document' };
    }
  }

  // Update document status
  static async updateDocumentStatus(
    documentId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<{ document: Document | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .update({ status })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        return { document: null, error: error.message };
      }

      return { document: data as unknown as Document, error: null };
    } catch (error) {
      return { document: null, error: 'Failed to update document status' };
    }
  }

  // Download document
  static async downloadDocument(documentId: string): Promise<{ downloadUrl: string | null; error: string | null }> {
    try {
      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        return { downloadUrl: null, error: fetchError.message };
      }

      if (!document) {
        return { downloadUrl: null, error: 'Document not found' };
      }

      // Use Edge Function to get signed URL
      const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('doc-manager', {
        body: {
          action: 'getSignedUrl',
          directFilePath: document.file_path as string,
          fileName: document.file_name as string
        }
      });

      if (edgeError) {
        console.error('❌ Edge Function error:', edgeError);
        return { downloadUrl: null, error: edgeError.message };
      }

      if (!edgeResult?.success || !edgeResult?.signedUrl) {
        console.error('❌ Edge Function returned error:', edgeResult);
        return { downloadUrl: null, error: edgeResult?.error || 'Failed to generate signed URL' };
      }

      console.log('✅ Document download URL generated via Edge Function');
      return { downloadUrl: edgeResult.signedUrl, error: null };
    } catch (error) {
      console.error('❌ Exception in downloadDocument:', error);
      return { downloadUrl: null, error: 'Failed to download document' };
    }
  }

  // Get document preview URL using API route
  static async getDocumentPreview(documentId: string): Promise<{ previewUrl: string | null; error: string | null }> {
    try {
      console.log('👁️ Getting document preview:', documentId);
      
      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        return { previewUrl: null, error: fetchError.message };
      }

      if (!document) {
        return { previewUrl: null, error: 'Document not found' };
      }

      // Use API route to get preview URL
      const response = await fetch('/api/documents/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: document.file_path
        })
      });

      if (!response.ok) {
        console.error('❌ API route error:', response.status, response.statusText);
        return { previewUrl: null, error: `Failed to get preview URL: ${response.statusText}` };
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('❌ API route returned error:', result);
        return { previewUrl: null, error: result.error || 'Failed to generate preview URL' };
      }

      console.log('✅ Document preview URL generated via API route');
      return { previewUrl: result.data.previewUrl, error: null };
    } catch (error) {
      console.error('❌ Exception in getDocumentPreview:', error);
      
      // Fallbacks removed for brevity
      return { previewUrl: null, error: 'Failed to get document preview' };
    }
  }

  // Get document statistics
  static async getDocumentStats(): Promise<{ stats: any; error: string | null }> {
    try {
      const { data: totalDocuments, error: totalError } = await supabase
        .from('employee_documents')
        .select('*', { count: 'exact' });

      const { data: pendingDocuments, error: pendingError } = await supabase
        .from('employee_documents')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      const { data: approvedDocuments, error: approvedError } = await supabase
        .from('employee_documents')
        .select('*', { count: 'exact' })
        .eq('status', 'approved');

      if (totalError || pendingError || approvedError) {
        return { stats: null, error: 'Failed to fetch document statistics' };
      }

      const stats = {
        total: totalDocuments?.length || 0,
        pending: pendingDocuments?.length || 0,
        approved: approvedDocuments?.length || 0,
      };

      return { stats, error: null };
    } catch (error) {
      return { stats: null, error: 'Failed to fetch document statistics' };
    }
  }

  // Debug method to see all documents in database
  static async debugAllDocuments(): Promise<{ documents: Document[]; error: string | null }> {
    try {
      console.log('🔍 DEBUG: Fetching ALL documents from database...');
      
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('❌ DEBUG Error:', error);
        return { documents: [], error: error.message };
      }

      const documents = data as unknown as Document[];
      console.log(`📄 DEBUG: Found ${documents.length} total documents`);
      
      // Group by company for analysis
      const companyGroups = new Map<string, Document[]>();
      documents.forEach(doc => {
        const pathParts = doc.file_path?.split('/') || [];
        const companyName = pathParts[0] || 'Unknown';
        if (!companyGroups.has(companyName)) {
          companyGroups.set(companyName, []);
        }
        companyGroups.get(companyName)!.push(doc);
      });

      console.log('🏢 DEBUG: Documents by company:');
      companyGroups.forEach((docs, company) => {
        console.log(`  ${company}: ${docs.length} documents`);
        // Show first few documents for each company
        docs.slice(0, 3).forEach(doc => {
          console.log(`    - ${doc.file_name} (${doc.employee_id})`);
        });
      });

      return { documents, error: null };
    } catch (error) {
      console.error('❌ DEBUG Exception:', error);
      return { documents: [], error: 'Failed to debug documents' };
    }
  }

  // Debug method to see folder structure
  static async debugFolderStructure(): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      console.log('🔍 DEBUG: Fetching folder structure...');
      
      const { folders, error } = await DocumentService.getDocumentFolders();
      
      if (error) {
        console.error('❌ DEBUG Folder Error:', error);
        return { folders: [], error: error };
      }

      console.log(`📁 DEBUG: Found ${folders.length} folders`);
      folders.forEach(folder => {
        console.log(`  ${folder.name}: ${folder.documentCount} documents`);
      });

      return { folders, error: null };
    } catch (error) {
      console.error('❌ DEBUG Folder Exception:', error);
      return { folders: [], error: 'Failed to debug folder structure' };
    }
  }

  // Debug method to check company documents
  static async debugCompanyDocuments(companyName: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      console.log(`🔍 DEBUG: Checking documents for company: ${companyName}`);
      
      // Get all documents to see what's available
      const { data: allDocs, error: allError } = await supabase
        .from('employee_documents')
        .select('file_path, file_name, employee_id')
        .ilike('file_path', `%${companyName}%`);

      if (allError) {
        console.error('❌ DEBUG Error fetching all documents:', allError);
        return { documents: [], error: allError.message };
      }

      console.log(`📄 DEBUG: Found ${allDocs?.length || 0} documents containing "${companyName}" in path:`);
      allDocs?.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.file_path} - ${doc.file_name} (Employee: ${doc.employee_id})`);
      });

      // Now get company-specific documents
      const { documents, error } = await this.getCompanyDocuments(companyName);
      
      console.log(`📄 DEBUG: Company documents for "${companyName}": ${documents.length}`);
      documents.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.file_path} - ${doc.file_name}`);
      });

      return { documents, error };
    } catch (error) {
      console.error('❌ DEBUG Exception in debugCompanyDocuments:', error);
      return { documents: [], error: 'Failed to debug company documents' };
    }
  }

  // Get presigned URL for document viewing - PERFORMANCE OPTIMIZED
  // Convenience method for getting signed URL by file path
  static async getSignedUrl(filePath: string): Promise<string> {
    try {
      const { data: edgeResult, error } = await supabase.functions.invoke('doc-manager', {
        body: { 
          action: 'getSignedUrl', 
          filePath: filePath 
        }
      });

      if (error || !edgeResult?.success || !edgeResult?.url) {
        throw new Error(error?.message || 'Failed to get signed URL');
      }

      return edgeResult.url;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }

  static async getDocumentPresignedUrl(documentId: string): Promise<{ data: string | null; error: string | null }> {
    try {
      // 1) Cache hit - check first
      const cached = this.presignedUrlCache.get(documentId);
      if (cached && Date.now() < cached.expiresAt) {
        return { data: cached.url, error: null };
      }

      // 2) Inflight de-duplication
      const inflight = this.presignedUrlInflight.get(documentId);
      if (inflight) return await inflight;

      const promise = (async (): Promise<{ data: string | null; error: string | null }> => {
        const { data: document, error } = await supabase
          .from('employee_documents')
          .select('file_path, file_url, file_name')
          .eq('id', documentId)
          .single();

        if (error) {
          console.error('❌ Error fetching document:', error);
          return { data: null, error: error.message };
        }

        if (!document) {
          console.error('❌ Document not found');
          return { data: null, error: 'Document not found' };
        }

        // 3a) If we have a path-level cache from batch prefetch, use it
        if (document.file_path) {
          const byPath = this.presignedByPathCache.get(document.file_path as string);
          if (byPath && Date.now() < byPath.expiresAt) {
            this.presignedUrlCache.set(documentId, { url: byPath.url, expiresAt: byPath.expiresAt });
            return { data: byPath.url, error: null };
          }
        }

        // 3b) Fast path: only trust stored file_url if it is already signed
        if (document.file_url && String(document.file_url).includes('Authorization=')) {
          const url = document.file_url as string;
          this.presignedUrlCache.set(documentId, { url, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes
          return { data: url, error: null };
        }

        // 4) Edge Function for signed URL - with timeout
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Edge function timeout')), 5000)
          );

          const edgePromise = supabase.functions.invoke('doc-manager', {
            body: {
              action: 'getSignedUrl',
              directFilePath: document.file_path as string,
              fileName: document.file_name as string
            }
          });

          const { data: edgeResult, error: edgeError } = await Promise.race([edgePromise, timeoutPromise]) as any;

          if (!edgeError && edgeResult?.success && edgeResult?.signedUrl) {
            const url = edgeResult.signedUrl as string;
            // Cache for a short period (Edge typically returns 1h expiry, we keep 10m)
            this.presignedUrlCache.set(documentId, { url, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes
            return { data: url, error: null };
          }
        } catch (edgeError) {
          console.error('❌ Edge Function error:', edgeError);
        }

        // 5) Fallback to local API route signing on Vercel
        try {
          const resp = await fetch('/api/documents/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: document.file_path })
          });
          if (resp.ok) {
            const json = await resp.json();
            const url = json?.data?.previewUrl as string | undefined;
            if (url) {
              this.presignedUrlCache.set(documentId, { url, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes
              return { data: url, error: null };
            }
          } else {
            console.error('❌ Preview API route failed:', resp.status, resp.statusText);
          }
        } catch (apiErr) {
          console.error('❌ Preview API route exception:', apiErr);
        }

        // 6) Final fallback: try to use the BackblazeService directly
        try {
          if (document.file_path) {
            const url = await BackblazeService.getPresignedUrl(document.file_path as string);
            if (url) {
              this.presignedUrlCache.set(documentId, { url, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes
              return { data: url, error: null };
            }
          }
        } catch (b2Error) {
          console.error('❌ BackblazeService fallback error:', b2Error);
        }

        // 7) Final: do NOT return an unsigned URL for private buckets
        console.error('❌ Failed to generate signed URL');
        return { data: null, error: 'Failed to generate signed URL' };
      })();

      this.presignedUrlInflight.set(documentId, promise);
      const result = await promise.finally(() => this.presignedUrlInflight.delete(documentId));
      return result;
    } catch (error) {
      console.error('❌ Exception in getDocumentPresignedUrl:', error);
      return { data: null, error: 'Failed to get presigned URL' };
    }
  }

  // Optimized method to get all documents with employee data in a single call
  static async getAllDocumentsWithEmployees(): Promise<{
    documents: any[];
    employees: any[];
    error?: string;
  }> {
    try {
      console.log('🚀 DocumentService: Fetching all documents with employees...');
      
      // Fetch all documents first
      const { data: documents, error: docError } = await supabase
        .from('employee_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (docError) {
        console.error('❌ Error fetching documents:', docError);
        return { documents: [], employees: [], error: docError.message };
      }

      // Get unique employee IDs from documents
      const employeeIds = [...new Set(documents?.map(doc => doc.employee_id) || [])];
      
      // Fetch employees separately to avoid relation issues
      const { data: employees, error: empError } = await supabase
        .from('employee_table')
        .select('id, employee_id, name, company_name, trade, is_active, nationality')
        .in('id', employeeIds);

      if (empError) {
        console.error('❌ Error fetching employees:', empError);
        return { documents: documents || [], employees: [], error: empError.message };
      }

      console.log(`✅ DocumentService: Fetched ${documents?.length || 0} documents and ${employees?.length || 0} employees`);
      
      return {
        documents: documents || [],
        employees: employees || []
      };
    } catch (error) {
      console.error('❌ DocumentService: Error fetching all documents with employees:', error);
      return {
        documents: [],
        employees: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 
