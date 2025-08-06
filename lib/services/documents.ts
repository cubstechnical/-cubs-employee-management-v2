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
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly SUPABASE_PAGE_SIZE = 1000; // Supabase default limit
  
  // Prevent multiple concurrent fetches
  private static isCurrentlyFetching = false;
  private static fetchPromise: Promise<any> | null = null;

  // Clear cache method for immediate updates
  static clearCache(): void {
    this.foldersCache = null;
    this.isCurrentlyFetching = false;
    this.fetchPromise = null;
    console.log('🗑️ Document folders cache cleared');
  }



  // Fetch ALL documents using pagination to bypass Supabase 1000 record limit
  private static async fetchAllDocuments(): Promise<{ documents: any[]; error: string | null }> {
    try {
      console.log('📄 Fetching ALL documents using pagination...');
      
      let allDocuments: any[] = [];
      let hasMore = true;
      let page = 0;
      let totalFetched = 0;

      while (hasMore) {
        const from = page * this.SUPABASE_PAGE_SIZE;
        const to = from + this.SUPABASE_PAGE_SIZE - 1;
        
        console.log(`📄 Fetching page ${page + 1} (records ${from + 1}-${to + 1})...`);
        
        const { data: documents, error } = await supabase
          .from('employee_documents')
          .select('file_path, uploaded_at, employee_id')
          .range(from, to)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error(`❌ Error fetching page ${page + 1}:`, error);
          return { documents: [], error: error.message };
        }

        if (!documents || documents.length === 0) {
          hasMore = false;
          console.log(`📄 No more documents found at page ${page + 1}`);
        } else {
          allDocuments = allDocuments.concat(documents);
          totalFetched += documents.length;
          console.log(`✅ Page ${page + 1}: Fetched ${documents.length} documents (Total: ${totalFetched})`);
          
          // If we got less than the page size, we've reached the end
          if (documents.length < this.SUPABASE_PAGE_SIZE) {
            hasMore = false;
            console.log(`📄 Reached end of data (got ${documents.length} < ${this.SUPABASE_PAGE_SIZE})`);
          }
          
          page++;
        }
      }

      console.log(`🎉 Successfully fetched ALL ${allDocuments.length} documents using pagination!`);
      return { documents: allDocuments, error: null };
      
    } catch (error) {
      console.error('❌ Error in fetchAllDocuments:', error);
      return { documents: [], error: 'Failed to fetch all documents' };
    }
  }

  // Fetch ALL documents for a specific company using pagination
  private static async fetchAllCompanyDocuments(companyName: string): Promise<{ documents: any[]; error: string | null }> {
    try {
      console.log(`📄 Fetching ALL documents for company: ${companyName} using pagination...`);
      
      let allDocuments: any[] = [];
      let hasMore = true;
      let page = 0;
      let totalFetched = 0;

      while (hasMore) {
        const from = page * this.SUPABASE_PAGE_SIZE;
        const to = from + this.SUPABASE_PAGE_SIZE - 1;
        
        console.log(`📄 Fetching page ${page + 1} for ${companyName} (records ${from + 1}-${to + 1})...`);
        
        // Handle both old format (EMP_ALHT) and new format (AL HANA TOURS and TRAVELS)
        let query = supabase
          .from('employee_documents')
          .select('employee_id, uploaded_at, file_path')
          .range(from, to)
          .order('uploaded_at', { ascending: false });

        // For AL HANA TOURS & TRAVELS, search both old and new folder patterns
        if (companyName === 'AL HANA TOURS & TRAVELS' || companyName === 'AL HANA TOURS and TRAVELS') {
          query = query.or(`file_path.ilike.EMP_ALHT/%,file_path.ilike.AL HANA TOURS and TRAVELS/%`);
        } else {
          query = query.ilike('file_path', `${companyName}/%`);
        }

        const { data: documents, error } = await query;

        if (error) {
          console.error(`❌ Error fetching page ${page + 1} for ${companyName}:`, error);
          return { documents: [], error: error.message };
        }

        if (!documents || documents.length === 0) {
          hasMore = false;
          console.log(`📄 No more documents found for ${companyName} at page ${page + 1}`);
        } else {
          allDocuments = allDocuments.concat(documents);
          totalFetched += documents.length;
          console.log(`✅ Page ${page + 1} for ${companyName}: Fetched ${documents.length} documents (Total: ${totalFetched})`);
          
          // If we got less than the page size, we've reached the end
          if (documents.length < this.SUPABASE_PAGE_SIZE) {
            hasMore = false;
            console.log(`📄 Reached end of data for ${companyName} (got ${documents.length} < ${this.SUPABASE_PAGE_SIZE})`);
          }
          
          page++;
        }
      }

      console.log(`🎉 Successfully fetched ALL ${allDocuments.length} documents for ${companyName} using pagination!`);
      return { documents: allDocuments, error: null };
      
    } catch (error) {
      console.error(`❌ Error in fetchAllCompanyDocuments for ${companyName}:`, error);
      return { documents: [], error: 'Failed to fetch company documents' };
    }
  }

  // Get company-wide documents (not associated with specific employees)
  static async getCompanyDocuments(companyName?: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      if (companyName) {
        console.log(`🔍 Fetching documents for company: ${companyName}`);
        
        const { data, error } = await supabase
          .from('employee_documents')
          .select('*')
          .ilike('file_path', `${companyName}/%`)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching company documents:', error);
          return { documents: [], error: error.message };
        }

        const documents = data ? (data as unknown as Document[]) : [];
        console.log(`✅ Found ${documents.length} documents for company ${companyName}`);
        
        return { documents, error: null };
      } else {
        console.log('🔍 Fetching EMP_COMPANY_DOCS documents...');
        
        const { data, error } = await supabase
          .from('employee_documents')
          .select('*')
          .ilike('file_path', 'EMP_COMPANY_DOCS/%')
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching company documents:', error);
          return { documents: [], error: error.message };
        }

        const documents = data ? (data as unknown as Document[]) : [];
        console.log(`✅ Found ${documents.length} EMP_COMPANY_DOCS documents`);
        
        return { documents, error: null };
      }
    } catch (error) {
      console.error('❌ Exception in getCompanyDocuments:', error);
      return { documents: [], error: 'Failed to fetch company documents' };
    }
  }

  // Get documents for a specific employee - CLEAN AND SIMPLE
  static async getDocumentsForEmployee(employeeId: string): Promise<{ documents: Document[]; error: string | null }> {
    try {
      console.log(`🔍 Fetching documents for employee ID: ${employeeId}`);
      
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching documents for employee:', error);
        return { documents: [], error: error.message };
      }

      const documents = data ? (data as unknown as Document[]) : [];
      console.log(`✅ Found ${documents.length} documents for employee ${employeeId}`);
      
      return { documents, error: null };
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
        console.log('📁 Using cached document folders');
        return { folders: this.foldersCache.folders, error: null };
      }

      // Prevent multiple concurrent fetches
      if (this.isCurrentlyFetching && this.fetchPromise) {
        console.log('📁 Another fetch is in progress, waiting...');
        return await this.fetchPromise;
      }

      console.log('🔍 Building company folder structure from actual file paths...');
      
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

      console.log(`📄 Found ${allDocuments?.length || 0} total documents (using pagination)`);

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

      console.log(`🏢 Found ${companyPrefixes.size} unique company prefixes in file paths:`, Array.from(companyPrefixes).sort());

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
      
      // Add company folders based on actual file paths
      for (const prefix of Array.from(companyPrefixes).sort()) {
        // Skip test folders
        if (prefix === 'FINAL_TEST') continue;
        
        // Count documents for this company prefix
        const companyDocs = allDocuments?.filter(doc => 
          doc.file_path && typeof doc.file_path === 'string' && doc.file_path.startsWith(prefix + '/')
        ) || [];
        
        const lastModified = companyDocs.length > 0 
          ? Math.max(...companyDocs.map(doc => new Date(doc.uploaded_at as string).getTime()))
          : Date.now();

        // Get display name from mapping, or use prefix as fallback
        const displayName = displayNameMapping[prefix] || prefix.replace(/_/g, ' ');

        companyFolders.push({
          id: `company-${prefix}`,
          name: displayName,
          type: 'company',
          companyName: prefix, // Use actual file path prefix for internal operations
          documentCount: companyDocs.length,
          lastModified: new Date(lastModified).toISOString(),
          path: `/${prefix}`
        });
      }

      console.log(`📁 Created ${companyFolders.length} company folders`);
      console.log('🔍 Company folders:', companyFolders.map(f => `${f.name} (${f.documentCount} docs)`));

      // Update cache
      this.foldersCache = {
        folders: companyFolders,
        timestamp: Date.now()
      };

      console.log(`📁 Processed ${companyFolders.length} folders exactly as they appear in Backblaze`);
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
      
      let documents: Document[] = [];
      let error: any = null;

      if (companyName === 'Company Documents') {
        // Get company documents (files directly in EMP_COMPANY_DOCS folder)
        console.log('📁 Fetching company documents...');
        const { data, error: docsError } = await supabase
          .from('employee_documents')
          .select('*')
          .ilike('file_path', 'EMP_COMPANY_DOCS/%')
          .not('file_path', 'like', 'EMP_COMPANY_DOCS/%/%') // Exclude subfolders
          .order('uploaded_at', { ascending: false });

        documents = data as unknown as Document[];
        error = docsError;
        console.log(`📁 Company documents found: ${documents?.length || 0}`);
      } else {
        // Try multiple approaches to get employee documents
        console.log(`👤 Fetching employee documents for ID: ${employeeId}`);
        
        // Approach 1: Get documents by employee_id field (exact match)
        console.log('🔍 Approach 1: Searching by employee_id field...');
        const { data: docsById, error: errorById } = await supabase
          .from('employee_documents')
          .select('*')
          .eq('employee_id', employeeId)
          .order('uploaded_at', { ascending: false });

        if (!errorById && docsById && docsById.length > 0) {
          documents = docsById as unknown as Document[];
          console.log(`✅ Found ${documents.length} documents by employee_id (exact match)`);
        } else {
          console.log('❌ No documents found by employee_id, trying file_path pattern...');
          
          // Approach 2: Get documents by file_path containing employee ID
          const { data: docsByPath, error: errorByPath } = await supabase
            .from('employee_documents')
            .select('*')
            .or(`file_path.ilike.%${employeeId}%,file_path.ilike.%${employeeId.replace(/\s+/g, '%20')}%`)
            .order('uploaded_at', { ascending: false });

          if (!errorByPath && docsByPath && docsByPath.length > 0) {
            documents = docsByPath as unknown as Document[];
            console.log(`✅ Found ${documents.length} documents by file_path pattern`);
          } else {
            console.log('❌ No documents found by file_path pattern, trying company pattern...');
            
            // Approach 3: Get documents by company and employee name pattern
            const { data: docsByCompany, error: errorByCompany } = await supabase
              .from('employee_documents')
              .select('*')
              .ilike('file_path', `${companyName}/%${employeeId}%`)
              .order('uploaded_at', { ascending: false });

            if (!errorByCompany && docsByCompany && docsByCompany.length > 0) {
              documents = docsByCompany as unknown as Document[];
              console.log(`✅ Found ${documents.length} documents by company pattern`);
            } else {
              console.log('❌ No documents found by company pattern, trying final approach...');
              
              // Approach 4: Get all documents for this company and filter by employee name
                console.log('🔍 Approach 5: Getting all company documents and filtering...');
                const { data: allCompanyDocs, error: errorAllCompany } = await supabase
                  .from('employee_documents')
                  .select('*')
                  .ilike('file_path', `${companyName}/%`)
                  .order('uploaded_at', { ascending: false });

                if (!errorAllCompany && allCompanyDocs && allCompanyDocs.length > 0) {
                  // Filter by employee name in the file path
                  const filteredDocs = allCompanyDocs.filter(doc => {
                    const filePath = doc.file_path as string;
                    const employeeName = employeeId.replace(/\s+/g, ' ').toLowerCase();
                    return filePath.toLowerCase().includes(employeeName);
                  });
                  
                  if (filteredDocs.length > 0) {
                    documents = filteredDocs as unknown as Document[];
                    console.log(`✅ Found ${documents.length} documents by name filtering`);
                  } else {
                    console.log('❌ No documents found by name filtering');
                error = 'No documents found for this employee';
              }
            } else {
              error = errorAllCompany;
              console.log('❌ No company documents found');
            }
          }
        }
      }
      }
      
      if (error) {
        console.error('❌ Database error:', error);
        return { documents: [], error: error.message };
      }

      console.log(`✅ Successfully fetched ${documents?.length || 0} documents`);
      return { documents: documents || [], error: null };
    } catch (error) {
      console.error('❌ Exception in getEmployeeDocuments:', error);
      return { documents: [], error: 'Failed to fetch employee documents' };
    }
  }

  // Get employee folders for a specific company with real document data - PERFORMANCE OPTIMIZED
  static async getEmployeeFolders(companyName: string): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      console.log(`👥 Getting employee folders for company: ${companyName}`);
      
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
      console.log(`🔍 Using file path company name: ${filePathCompanyName} for display name: ${companyName}`);
      
      // Special handling for Company Documents - show files directly, not employee folders
      if (companyName === 'Company Documents') {
        console.log('📁 Company Documents: Returning empty folders array (files should be shown directly)');
        return { folders: [], error: null };
      }
      
      // Get all documents for this company using pagination
      const { documents: companyDocs, error } = await this.fetchAllCompanyDocuments(filePathCompanyName);

      if (error) {
        console.error('❌ Error fetching company documents:', error);
        return { folders: [], error };
      }

      console.log(`📄 Found ${companyDocs?.length || 0} documents for company ${companyName} (using pagination)`);

      if (!companyDocs || companyDocs.length === 0) {
        console.log('❌ No documents found for this company');
        return { folders: [], error: null };
      }

      // Get unique employee IDs from documents
      const employeeIds = Array.from(new Set(companyDocs?.map(doc => doc.employee_id as string).filter(Boolean) || []));
      console.log(`👥 Found ${employeeIds.length} unique employee IDs:`, employeeIds);

      if (employeeIds.length === 0) {
        console.log('❌ No employee IDs found');
        return { folders: [], error: null };
      }

      // Get employee names from employee_table
      const { data: employees, error: employeeError } = await supabase
        .from('employee_table')
        .select('employee_id, name')
        .in('employee_id', employeeIds);

      if (employeeError) {
        console.error('❌ Error fetching employee names:', employeeError);
        return { folders: [], error: employeeError.message };
      }

      console.log(`👤 Found ${employees?.length || 0} employee records`);

      // Create a map for quick employee name lookup
      const employeeMap = new Map<string, string>();
      employees?.forEach(emp => {
        employeeMap.set(emp.employee_id as string, emp.name as string);
      });

      // Group documents by employee and create folders
      const employeeFolders = new Map<string, { count: number; lastModified: string; name: string }>();

      companyDocs?.forEach(doc => {
        const employeeId = doc.employee_id as string;
        if (employeeId) {
          const employeeName = employeeMap.get(employeeId) || employeeId;
          const timestamp = new Date(doc.uploaded_at as string).getTime();
          
          const existing = employeeFolders.get(employeeId);
          if (existing) {
            existing.count += 1;
            existing.lastModified = Math.max(parseInt(existing.lastModified), timestamp).toString();
          } else {
            employeeFolders.set(employeeId, {
              count: 1,
              lastModified: timestamp.toString(),
              name: employeeName
            });
          }
        }
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

      console.log(`✅ Created ${folders.length} employee folders for ${companyName}`);
      return { folders, error: null };
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
      
      // Fallback: try to use the stored file_url if available
      if ((document as any).file_url) {
        console.log('🔄 Using fallback file_url for preview');
        return { previewUrl: (document as any).file_url, error: null };
      }
      
      // Second fallback: try to construct a direct URL from file_path
      if ((document as any).file_path) {
        console.log('🔄 Using fallback direct URL construction');
        try {
          const directUrl = `https://f005.backblazeb2.com/file/cubsdocs/${(document as any).file_path}`;
          return { previewUrl: directUrl, error: null };
        } catch (fallbackError) {
          console.error('❌ Fallback URL construction failed:', fallbackError);
        }
      }
      
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
} 

