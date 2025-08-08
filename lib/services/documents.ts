import { supabase } from '../supabase/client';

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
  // Cache for document folders to improve performance
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
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (increased to reduce API calls)
  private static readonly SUPABASE_PAGE_SIZE = 1000; // Supabase hard page limit
  
  // Prevent multiple concurrent fetches
  private static isCurrentlyFetching = false;
  private static fetchPromise: Promise<any> | null = null;

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
    this.isCurrentlyFetching = false;
    this.fetchPromise = null;
    console.log('🗑️ Document folders and company documents cache cleared');
  }

  // Force refresh method to clear cache and rebuild folders
  static async forceRefresh(): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    console.log('🔄 Force refreshing document folders...');
    this.clearCache();
    return await this.getDocumentFolders();
  }

  // Fetch ALL documents using pagination to bypass Supabase 1000 record limit
  private static async fetchAllDocuments(): Promise<{ documents: any[]; error: string | null }> {
    try {
      if (process.env.NODE_ENV !== 'production') console.log('📄 Fetching documents (paginated)...');

      const pageSize = this.SUPABASE_PAGE_SIZE;
      let from = 0;
      let to = pageSize - 1;
      const allDocuments: any[] = [];

      while (true) {
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

      // Cache and in-flight dedupe for heavy paginated call
      const cached = this.companyDocsRawCache.get(companyName);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return { documents: cached.docs, error: null };
      }
      const inflight = this.companyDocsInflight.get(companyName);
      if (inflight) return inflight;

      const pageSize = this.SUPABASE_PAGE_SIZE;
      let from = 0;
      let to = pageSize - 1;
      const allDocuments: any[] = [];

      // Build base filtered query per company
      const buildQuery = (fromIdx: number, toIdx: number) => {
        let q = supabase
          .from('employee_documents')
          .select('employee_id')
          .range(fromIdx, toIdx);

        if (companyName === 'AL HANA TOURS & TRAVELS' || companyName === 'AL HANA TOURS and TRAVELS') {
          q = q.or(`file_path.like.EMP_ALHT/%,file_path.like.AL HANA TOURS and TRAVELS/%`);
        } else {
          q = q.like('file_path', `${companyName}/%`);
        }
        return q;
      };

      const run = async () => {
        while (true) {
        const { data, error } = await buildQuery(from, to);
        if (error) {
          console.error(`❌ Error fetching documents for ${companyName}:`, error);
            return { documents: [], error: error.message };
        }
        const batch = data || [];
        allDocuments.push(...batch);
        if (process.env.NODE_ENV !== 'production') console.log(`  • ${companyName} batch ${from}-${to} → ${batch.length}`);
        if (batch.length < pageSize) break;
        from += pageSize;
        to += pageSize;
        }

        if (process.env.NODE_ENV !== 'production') console.log(`✅ Found ${allDocuments.length} documents for ${companyName}`);
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

  // Get company-wide documents (not associated with specific employees)
  static async getCompanyDocuments(companyName?: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      if (companyName) {
        if (process.env.NODE_ENV !== 'production') console.log(`🔍 Fetching documents for company: ${companyName}`);
        const pageSize = this.SUPABASE_PAGE_SIZE;
        let from = 0;
        let to = pageSize - 1;
        const results: any[] = [];
        while (true) {
          const { data, error } = await supabase
            .from('employee_documents')
            .select('*')
            .ilike('file_path', `${companyName}/%`)
            .order('uploaded_at', { ascending: false })
            .range(from, to);
          if (error) {
            console.error('❌ Error fetching company documents:', error);
            return { documents: [], error: error.message };
          }
          const batch = data || [];
          results.push(...batch);
          if (batch.length < pageSize) break;
          from += pageSize;
          to += pageSize;
        }
        const documents = results as unknown as Document[];
        if (process.env.NODE_ENV !== 'production') console.log(`✅ Found ${documents.length} documents for company ${companyName}`);
        return { documents, error: null };
      } else {
        // Check cache first for Company Documents
        if (this.companyDocumentsCache && (Date.now() - this.companyDocumentsCache.timestamp) < this.CACHE_DURATION) {
        if (process.env.NODE_ENV !== 'production') console.log('📁 Using cached Company Documents');
          return { documents: this.companyDocumentsCache.documents, error: null };
        }

        if (process.env.NODE_ENV !== 'production') console.log('🔍 Fetching Company Documents...');
        
        // Get documents with employee_id = 'COMPANY_DOCS'
        const { data: companyDocs, error: companyError } = await supabase
          .from('employee_documents')
          .select('*')
          .eq('employee_id', 'COMPANY_DOCS')
          .order('uploaded_at', { ascending: false });

        if (companyError) {
          console.error('❌ Error fetching company documents by employee_id:', companyError);
        }

        // Also get documents with specific file paths
        const { data: pathDocs, error: pathError } = await supabase
          .from('employee_documents')
          .select('*')
          .or('file_path.ilike.EMP_COMPANY_DOCS/%,file_path.ilike.Company Documents/%')
          .order('uploaded_at', { ascending: false });

        if (pathError) {
          console.error('❌ Error fetching company documents by path:', pathError);
        }

        // Combine and deduplicate results
        const allDocs = [...(companyDocs || []), ...(pathDocs || [])];
        const uniqueDocs = allDocs.filter((doc, index, self) => 
          index === self.findIndex(d => d.id === doc.id)
        );

        const documents = uniqueDocs as unknown as Document[];
        if (process.env.NODE_ENV !== 'production') console.log(`✅ Found ${documents.length} Company Documents (${companyDocs?.length || 0} by employee_id, ${pathDocs?.length || 0} by path)`);
        
        // Cache the results
        this.companyDocumentsCache = {
          documents,
          timestamp: Date.now()
        };
        
        return { documents, error: null };
      }
    } catch (error) {
      console.error('❌ Exception in getCompanyDocuments:', error);
      return { documents: [], error: 'Failed to fetch company documents' };
    }
  }

  // Get documents for a specific employee (optimized)
  static async getDocumentsForEmployee(employeeId: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      const cached = this.employeeDocsCache.get(employeeId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return { documents: cached.documents, error: null };
      }
      const inflight = this.employeeDocsInflight.get(employeeId);
      if (inflight) return inflight;

      if (process.env.NODE_ENV !== 'production') console.log(`🔍 Fetching documents for employee ID: ${employeeId}...`);
      const pageSize = this.SUPABASE_PAGE_SIZE;
      let from = 0;
      let to = pageSize - 1;
      const results: any[] = [];
      const run = async () => {
        while (true) {
          const { data, error } = await supabase
            .from('employee_documents')
            .select('*')
            .eq('employee_id', employeeId)
            .order('uploaded_at', { ascending: false })
            .range(from, to);
          if (error) {
            console.error(`❌ Error fetching documents for employee ${employeeId}:`, error);
            return { documents: [], error: error.message };
          }
          const batch = data || [];
          results.push(...batch);
          if (batch.length < pageSize) break;
          from += pageSize;
          to += pageSize;
        }
        const documents = results as unknown as Document[];
        if (process.env.NODE_ENV !== 'production') console.log(`✅ Found ${documents.length} documents for employee ${employeeId}`);
        this.employeeDocsCache.set(employeeId, { documents, timestamp: Date.now() });
        return { documents, error: null };
      };
      const promise = run().finally(() => {
        this.employeeDocsInflight.delete(employeeId);
      });
      this.employeeDocsInflight.set(employeeId, promise);
      return promise;
    } catch (error) {
      console.error('❌ Exception in getDocumentsForEmployee:', error);
      return { documents: [], error: 'Failed to fetch documents for employee' };
    }
  }

  // Get all documents with optional filters
  static async getDocuments(filters?: {
    employee_id?: string;
    company_name?: string;
    document_type?: string;
    is_active?: boolean;
    file_path?: string;
  }): Promise<{ documents: Document[]; error: string | null }> {
    try {
      let query = supabase
        .from('employee_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

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

      const { data, error } = await query;

      if (error) {
        return { documents: [], error: error.message };
      }

      return { documents: data ? (data as unknown as Document[]) : [], error: null };
    } catch (error) {
      return { documents: [], error: 'Failed to fetch documents' };
    }
  }

  // Get document folders (companies and company documents)
  static async getDocumentFolders(): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      // Check cache first for better performance
      if (this.foldersCache && (Date.now() - this.foldersCache.timestamp) < this.CACHE_DURATION) {
        if (process.env.NODE_ENV !== 'production') console.log('📁 Using cached document folders');
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
            const folders: DocumentFolder[] = (mvRows as any[])
              .filter(r => r.company_prefix && r.display_name)
              .map(r => ({
                id: `company-${r.company_prefix}`,
                name: r.display_name as string,
                type: 'company' as const,
                companyName: r.company_prefix as string,
                documentCount: Number(r.document_count) || 0,
                lastModified: r.last_modified ? new Date(r.last_modified as string).toISOString() : new Date().toISOString(),
                path: `/${r.company_prefix}`
              }));
            if (folders.length > 0) {
              this.foldersCache = { folders, timestamp: Date.now() };
              if (process.env.NODE_ENV !== 'production') console.log('⚡ Using materialized view for company folders');
              return { folders, error: null };
            }
          }
        } catch (e) {
          // View not available or RLS blocked – silently fallback
        }
      }

      // Prevent multiple concurrent fetches
      if (this.isCurrentlyFetching && this.fetchPromise) {
        if (process.env.NODE_ENV !== 'production') console.log('📁 Another fetch is in progress, waiting...');
        return await this.fetchPromise;
      }

      if (process.env.NODE_ENV !== 'production') console.log('🔍 Building company folder structure from actual file paths...');
      
      // Mark as fetching and create promise
      this.isCurrentlyFetching = true;
      this.fetchPromise = this._buildFolders();
      
      try {
        const result = await this.fetchPromise;
        return result;
      } finally {
        this.isCurrentlyFetching = false;
        this.fetchPromise = null;
      }
    } catch (error) {
      this.isCurrentlyFetching = false;
      this.fetchPromise = null;
      console.error('❌ Error in getDocumentFolders:', error);
      return { folders: [], error: 'Failed to build document folders' };
    }
  }

  // Internal method to build folders
  private static async _buildFolders(): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      // Get document counts for each company - fetch ALL documents using pagination
      const { documents: allDocuments, error: docsError } = await this.fetchAllDocuments();

      if (docsError) {
        console.error('❌ Error fetching documents:', docsError);
        return { folders: [], error: docsError };
      }

      if (process.env.NODE_ENV !== 'production') console.log(`📄 Found ${allDocuments?.length || 0} total documents (paginated)`);

      // Extract unique company prefixes from actual file paths
      const companyPrefixes = new Set<string>();
      allDocuments?.forEach(doc => {
        if (doc.file_path && typeof doc.file_path === 'string') {
          const parts = doc.file_path.split('/');
          if (parts.length > 0 && parts[0]) {
            companyPrefixes.add(parts[0]);
          }
        }
      });

      if (process.env.NODE_ENV !== 'production') console.log(`🏢 Found ${companyPrefixes.size} unique company prefixes in file paths:`, Array.from(companyPrefixes).sort());

      // Create company folders based on actual file paths
      const companyFolders: DocumentFolder[] = [];
      
      // Create mapping from file path prefixes to display names (including new user-friendly paths)
      const displayNameMapping: { [key: string]: string } = {
        // Legacy folder mappings (for existing documents)
        'AL_ASHBAL_AJMAN': 'AL ASHBAL AJMAN',
        'CUBS': 'CUBS CONTRACTING',
        'ASHBAL_AL_KHALEEJ': 'ASHBAL AL KHALEEJ',
        'FLUID_ENGINEERING': 'FLUID',
        'RUKIN_AL_ASHBAL': 'RUKIN',
        'GOLDEN_CUBS': 'GOLDEN CUBS',
        'AL MACEN': 'AL MACEN',
        'CUBS_TECH': 'CUBS TECH',
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
        const companyDocs = allDocuments?.filter(doc => 
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
        const primaryPrefix = data.prefixes[0]; // Use first prefix as primary
        companyFolders.push({
          id: `company-${primaryPrefix}`,
          name: displayName,
          type: 'company',
          companyName: primaryPrefix, // Use primary prefix for internal operations
          documentCount: data.documents.length,
          lastModified: new Date(data.lastModified).toISOString(),
          path: `/${primaryPrefix}`
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

  // Get documents for a specific employee or company documents
  static async getEmployeeDocuments(companyName: string, employeeId: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      console.log(`🔍 Fetching documents for: ${companyName}/${employeeId}`);

      // Special handling for top-level Company Documents
      if (companyName === 'Company Documents') {
        const { data, error } = await supabase
          .from('employee_documents')
          .select('*')
          .ilike('file_path', 'EMP_COMPANY_DOCS/%')
          .not('file_path', 'like', 'EMP_COMPANY_DOCS/%/%')
          .order('uploaded_at', { ascending: false });
        if (error) {
          return { documents: [], error: error.message };
        }
        return { documents: (data || []) as unknown as Document[], error: null };
      }

      // 1) Exact match by employee_id
      const { data: byId, error: byIdErr } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('uploaded_at', { ascending: false });
      if (!byIdErr && byId && byId.length > 0) {
        return { documents: byId as unknown as Document[], error: null };
      }

      // 2) file_path contains employeeId (handles name-in-path cases too)
      const encoded = employeeId.replace(/\s+/g, '%20');
      const { data: byPath, error: byPathErr } = await supabase
        .from('employee_documents')
        .select('*')
        .or(`file_path.ilike.%${employeeId}%,file_path.ilike.%${encoded}%`)
        .order('uploaded_at', { ascending: false });
      if (!byPathErr && byPath && byPath.length > 0) {
        return { documents: byPath as unknown as Document[], error: null };
      }

      // 3) Company-specific prefix with employee identifier in the rest of the path
      const { data: byCompany, error: byCompanyErr } = await supabase
        .from('employee_documents')
        .select('*')
        .ilike('file_path', `${companyName}/%${employeeId}%`)
        .order('uploaded_at', { ascending: false });
      if (!byCompanyErr && byCompany && byCompany.length > 0) {
        return { documents: byCompany as unknown as Document[], error: null };
      }

      // 4) Fallback: fetch company docs and filter by a normalized employeeId token
      const { data: allCompanyDocs, error: allCompanyErr } = await supabase
        .from('employee_documents')
        .select('*')
        .ilike('file_path', `${companyName}/%`)
        .order('uploaded_at', { ascending: false });
      if (allCompanyErr) {
        return { documents: [], error: allCompanyErr.message };
      }
      const needle = employeeId.replace(/\s+/g, ' ').toLowerCase();
      const filtered = (allCompanyDocs || []).filter((d) =>
        String(d.file_path || '').toLowerCase().includes(needle)
      );

      if (filtered.length > 0) {
        return { documents: filtered as unknown as Document[], error: null };
      }

      return { documents: [], error: 'No documents found for this employee' };
    } catch (error) {
      console.error('❌ Exception in getEmployeeDocuments:', error);
      return { documents: [], error: 'Failed to fetch employee documents' };
    }
  }

  // Get employee folders for a specific company with real document data - PERFORMANCE OPTIMIZED
  static async getEmployeeFolders(companyName: string): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      if (process.env.NODE_ENV !== 'production') console.log(`👥 Getting employee folders for company: ${companyName}`);
      
      // Create mapping from display names to file path company names
      const companyNameMapping: { [key: string]: string } = {
        'AL ASHBAL AJMAN': 'AL_ASHBAL_AJMAN',
        'CUBS CONTRACTING': 'CUBS',
        'ASHBAL AL KHALEEJ': 'ASHBAL_AL_KHALEEJ',
        'FLUID': 'FLUID_ENGINEERING',
        'RUKIN': 'RUKIN_AL_ASHBAL',
        'GOLDEN CUBS': 'GOLDEN_CUBS',
        'AL MACEN': 'AL MACEN',
        'CUBS TECH': 'CUBS_TECH',
        'AL HANA TOURS & TRAVELS': 'AL HANA TOURS and TRAVELS',
        'Company Documents': 'EMP_COMPANY_DOCS',
        // New user-friendly paths
        'AL HANA TOURS and TRAVELS': 'AL HANA TOURS and TRAVELS'
      };
      
      // Get the corresponding file path company name
      const filePathCompanyName = companyNameMapping[companyName] || companyName;
      if (process.env.NODE_ENV !== 'production') console.log(`🔍 Using file path company name: ${filePathCompanyName} for display name: ${companyName}`);
      
      // Special handling for Company Documents - show files directly, not employee folders
      if (companyName === 'Company Documents') {
        if (process.env.NODE_ENV !== 'production') console.log('📁 Company Documents: Returning empty folders array (files should be shown directly)');
        return { folders: [], error: null };
      }
      
      // Check cache
      const cached = this.employeeFoldersCache.get(filePathCompanyName);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
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
                name: (r.employee_name as string) || (r.employee_id as string),
                type: 'employee' as const,
                companyName,
                employeeId: r.employee_id as string,
                employeeName: (r.employee_name as string) || (r.employee_id as string),
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

      // Get all documents for this company using pagination
      const run = async (): Promise<{ folders: DocumentFolder[]; error: string | null }> => {
        const { documents: companyDocs, error } = await this.fetchAllCompanyDocuments(filePathCompanyName);

        if (error) {
          console.error('❌ Error fetching company documents:', error);
          return { folders: [], error };
        }

        if (process.env.NODE_ENV !== 'production') console.log(`📄 Found ${companyDocs?.length || 0} documents for company ${companyName} (paginated)`);

        if (!companyDocs || companyDocs.length === 0) {
          if (process.env.NODE_ENV !== 'production') console.log('❌ No documents found for this company');
          this.employeeFoldersCache.set(filePathCompanyName, { folders: [], timestamp: Date.now() });
          return { folders: [], error: null };
        }

        // Get unique employee IDs from documents (minimal rows contain only employee_id)
        const employeeIds = Array.from(new Set((companyDocs || []).map((doc: any) => doc.employee_id as string).filter(Boolean)));
        if (process.env.NODE_ENV !== 'production') console.log(`👥 Found ${employeeIds.length} unique employee IDs`);

        if (employeeIds.length === 0) {
          if (process.env.NODE_ENV !== 'production') console.log('❌ No employee IDs found');
          this.employeeFoldersCache.set(filePathCompanyName, { folders: [], timestamp: Date.now() });
          return { folders: [], error: null };
        }

        // Get employee names from employee_table in chunks to avoid IN() limits
        const chunkSize = 500;
        const chunks: string[][] = [];
        for (let i = 0; i < employeeIds.length; i += chunkSize) {
          chunks.push(employeeIds.slice(i, i + chunkSize));
        }
        const employeeRows: Array<{ employee_id: string; name: string }> = [];
        for (const chunk of chunks) {
          const { data: employees, error: employeeError } = await supabase
            .from('employee_table')
            .select('employee_id, name')
            .in('employee_id', chunk);
          if (employeeError) {
            console.error('❌ Error fetching employee names:', employeeError);
            return { folders: [], error: employeeError.message };
          }
          (employees || []).forEach(r => employeeRows.push(r as any));
        }

        if (process.env.NODE_ENV !== 'production') console.log(`👤 Found ${employeeRows.length} employee records`);

        // Create a map for quick employee name lookup
        const employeeMap = new Map<string, string>();
        employeeRows.forEach(emp => {
          employeeMap.set(emp.employee_id as string, emp.name as string);
        });

        // Group documents by employee and create folders
        const employeeFolders = new Map<string, { count: number; lastModified: string; name: string }>();

        // Count documents per employee (fast path, lastModified approximated)
        const counts = new Map<string, number>();
        for (const row of companyDocs || []) {
          const id = row.employee_id as string | null | undefined;
          if (!id) continue;
          counts.set(id, (counts.get(id) || 0) + 1);
        }
        counts.forEach((count, employeeId) => {
          const employeeName = employeeMap.get(employeeId) || employeeId;
          employeeFolders.set(employeeId, {
            count,
            lastModified: Date.now().toString(),
            name: employeeName
          });
        });

        // Convert to DocumentFolder array
        const folders: DocumentFolder[] = Array.from(employeeFolders.entries()).map(([employeeId, data]) => ({
          id: `emp-${employeeId}`,
          name: data.name,
          type: 'employee' as const,
          companyName: companyName,
          employeeId: employeeId,
          employeeName: data.name,
          documentCount: data.count,
          lastModified: data.lastModified,
          path: `${companyName}/${employeeId}`
        }));

        if (process.env.NODE_ENV !== 'production') console.log(`✅ Created ${folders.length} employee folders for ${companyName}`);
        this.employeeFoldersCache.set(filePathCompanyName, { folders, timestamp: Date.now() });
        return { folders, error: null };
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
      const companyName = pathParts[0] || 'Unknown';
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

      // Save document metadata to Supabase
      const { data: document, error: dbError } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: uploadData.employee_id,
          document_type: uploadData.document_type,
          file_name: uploadData.file_name,
          file_url: uploadResult.fileUrl || '',
          file_size: uploadData.file_size,
          file_path: uploadData.file_path,
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
          // Continue with Supabase deletion even if Backblaze fails
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

  // Get presigned URL for document viewing
  static async getDocumentPresignedUrl(documentId: string): Promise<{ url: string | null; error: string | null }> {
    try {
      console.log(`🔍 Getting presigned URL for document: ${documentId}`);
      
      const { data: document, error } = await supabase
        .from('employee_documents')
        .select('file_path, file_url, file_name')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('❌ Error fetching document:', error);
        return { url: null, error: error.message };
      }

      if (!document) {
        console.error('❌ Document not found');
        return { url: null, error: 'Document not found' };
      }

      // Try Edge Function first
      try {
        const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('doc-manager', {
          body: {
            action: 'getSignedUrl',
            directFilePath: document.file_path as string,
            fileName: document.file_name as string
          }
        });

        if (!edgeError && edgeResult?.success && edgeResult?.signedUrl) {
          console.log('✅ Document presigned URL generated via Edge Function');
          return { url: edgeResult.signedUrl, error: null };
        }
      } catch (edgeError) {
        console.error('❌ Edge Function error:', edgeError);
      }

      // Fallback to direct Backblaze URL construction
      console.log('🔄 Falling back to direct Backblaze URL');
      const directUrl = `https://f005.backblazeb2.com/file/cubsdocs/${encodeURIComponent(document.file_path as string)}`;
      console.log('🔗 Direct URL:', directUrl);
      return { url: directUrl, error: null };
      
    } catch (error) {
      console.error('❌ Exception in getDocumentPresignedUrl:', error);
      return { url: null, error: 'Failed to get presigned URL' };
    }
  }
} 
