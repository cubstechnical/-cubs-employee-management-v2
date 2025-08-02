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
        query = query.ilike('file_path', `%${filters.file_path}%`);
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

  // Get document folders (companies) with real document data - PERFORMANCE OPTIMIZED
  static async getDocumentFolders(): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      // Check cache first for better performance
      if (this.foldersCache && (Date.now() - this.foldersCache.timestamp) < this.CACHE_DURATION) {
        console.log('📁 Using cached document folders');
        return { folders: this.foldersCache.folders, error: null };
      }

      // Use a more efficient query with SQL aggregation for better performance
      const { data: companyStats, error: statsError } = await supabase
        .from('employee_documents')
        .select('file_path, uploaded_at')
        .limit(1000); // Reasonable limit for performance

      if (statsError) {
        return { folders: [], error: statsError.message };
      }

      // Process company data efficiently
      const companyData = new Map<string, { count: number; lastModified: string }>();

      companyStats?.forEach(doc => {
        if (doc.file_path && typeof doc.file_path === 'string') {
          const pathParts = doc.file_path.split('/');
          const companyName = pathParts[0];
          
          if (companyName && companyName !== 'EMP_COMPANY_DOCS') {
            const existing = companyData.get(companyName);
            const timestamp = new Date(doc.uploaded_at as string).getTime();
            
            companyData.set(companyName, {
              count: (existing?.count || 0) + 1,
              lastModified: existing ? Math.max(parseInt(existing.lastModified), timestamp).toString() : timestamp.toString()
            });
          }
        }
      });

      // Get AL HANA TOURS & TRAVELS data separately for better performance
      const { data: alHanaStats, error: alHanaError } = await supabase
        .from('employee_documents')
        .select('file_path, uploaded_at')
        .or('file_path.ilike.EMP_ALHT0001/%,file_path.ilike.EMP_ALHT0002/%,file_path.ilike.EMP_ALHT0003/%,file_path.ilike.EMP_ALHT0004/%,file_path.ilike.EMP_ALHT0005/%')
        .limit(500);

      if (!alHanaError && alHanaStats) {
        let alHanaDocCount = 0;
        let alHanaLastModified = 0;

        alHanaStats.forEach(doc => {
          alHanaDocCount++;
          const timestamp = new Date(doc.uploaded_at as string).getTime();
          alHanaLastModified = Math.max(alHanaLastModified, timestamp);
        });

        companyData.set('AL_HANA_TOURS_TRAVELS', {
          count: alHanaDocCount,
          lastModified: alHanaLastModified.toString()
        });
      }

      // Convert to folders array
      const result = this.processCompanyData(companyData);

      // Update cache
      this.foldersCache = {
        folders: result.folders,
        timestamp: Date.now()
      };

      console.log(`📁 Processed ${result.folders.length} document folders`);
      return { folders: result.folders, error: null };
    } catch (error) {
      console.error('❌ Error in getDocumentFolders:', error);
      return { folders: [], error: 'Failed to fetch document folders' };
    }
  }

  private static processCompanyData(companyData: Map<string, { count: number; lastModified: string }>): { folders: DocumentFolder[]; error: string | null } {
    try {
      const folders: DocumentFolder[] = [];

      companyData.forEach((data, companyName) => {
        folders.push({
          id: companyName,
          name: companyName.replace(/_/g, ' '),
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
      
      let documents;
      let error;

      if (companyName === 'company-documents') {
        // Get company documents (files directly in EMP_COMPANY_DOCS folder)
        console.log('📁 Fetching company documents...');
        const { data, error: docsError } = await supabase
          .from('employee_documents')
          .select('*')
          .ilike('file_path', 'EMP_COMPANY_DOCS/%')
          .not('file_path', 'like', 'EMP_COMPANY_DOCS/%/%') // Exclude subfolders
          .order('uploaded_at', { ascending: false });

        documents = data;
        error = docsError;
        console.log(`📁 Company documents found: ${documents?.length || 0}`);
      } else {
        // Get documents for this specific employee using employee_id
        console.log(`👤 Fetching employee documents for ID: ${employeeId}`);
        const { data, error: empError } = await supabase
          .from('employee_documents')
          .select('*')
          .eq('employee_id', employeeId)
          .order('uploaded_at', { ascending: false });

        documents = data;
        error = empError;
        console.log(`👤 Employee documents found: ${documents?.length || 0}`);
      }

      if (error) {
        console.error('❌ Database error:', error);
        return { documents: [], error: error.message };
      }

      console.log(`✅ Successfully fetched ${documents?.length || 0} documents`);
      return { documents: documents ? (documents as unknown as Document[]) : [], error: null };
    } catch (error) {
      console.error('❌ Exception in getEmployeeDocuments:', error);
      return { documents: [], error: 'Failed to fetch employee documents' };
    }
  }

  // Get employee folders for a specific company with real document data - PERFORMANCE OPTIMIZED
  static async getEmployeeFolders(companyName: string): Promise<{ folders: DocumentFolder[]; error: string | null }> {
    try {
      let companyDocs;
      let companyError;

      // Handle AL HANA TOURS & TRAVELS specially
      if (companyName === 'AL_HANA_TOURS_TRAVELS') {
        const { data, error } = await supabase
          .from('employee_documents')
          .select('employee_id, uploaded_at') // Only select needed fields
          .or('file_path.ilike.EMP_ALHT0001/%,file_path.ilike.EMP_ALHT0002/%,file_path.ilike.EMP_ALHT0003/%,file_path.ilike.EMP_ALHT0004/%,file_path.ilike.EMP_ALHT0005/%')
          .limit(300); // Reduced limit for better performance
        
        companyDocs = data;
        companyError = error;
      } else {
        // Get documents for this company from file paths
        const { data, error } = await supabase
          .from('employee_documents')
          .select('employee_id, uploaded_at') // Only select needed fields
          .ilike('file_path', `${companyName}/%`)
          .limit(300); // Reduced limit for better performance
        
        companyDocs = data;
        companyError = error;
      }

      if (companyError) {
        return { folders: [], error: companyError.message };
      }

      // Get unique employee IDs from documents
      const employeeIds = Array.from(new Set(companyDocs?.map(doc => doc.employee_id as string).filter(Boolean) || []));

      if (employeeIds.length === 0) {
        return { folders: [], error: null };
      }

      // Get employee names from employee_table
      const { data: employees, error: employeeError } = await supabase
        .from('employee_table')
        .select('employee_id, name')
        .in('employee_id', employeeIds);

      if (employeeError) {
        return { folders: [], error: employeeError.message };
      }

      // Create a map for quick employee name lookup
      const employeeMap = new Map(employees?.map(emp => [emp.employee_id, emp.name]) || []);

      // Group documents by employee and calculate stats
      const employeeStats = new Map<string, { count: number; lastModified: string }>();

      companyDocs?.forEach(doc => {
        const employeeId = doc.employee_id as string;
        if (employeeId) {
          const existing = employeeStats.get(employeeId);
          const timestamp = new Date(doc.uploaded_at as string).getTime();
          
          employeeStats.set(employeeId, {
            count: (existing?.count || 0) + 1,
            lastModified: existing ? Math.max(parseInt(existing.lastModified), timestamp).toString() : timestamp.toString()
          });
        }
      });

      // Convert to folders array
      const folders: DocumentFolder[] = [];

      employeeStats.forEach((stats, employeeId) => {
        const employeeName = employeeMap.get(employeeId) || employeeId;
        
        folders.push({
          id: employeeId,
          name: employeeName as string,
          type: 'employee' as const,
          companyName,
          employeeId,
          employeeName: employeeName as string,
          documentCount: stats.count,
          lastModified: parseInt(stats.lastModified) > 0 ? new Date(parseInt(stats.lastModified)).toISOString() : new Date().toISOString(),
          path: `/company/${companyName}/employee/${employeeId}`
        });
      });

      // Sort by employee name
      folders.sort((a, b) => a.name.localeCompare(b.name));

      console.log(`📁 Found ${folders.length} employee folders for ${companyName}`);
      return { folders, error: null };
    } catch (error) {
      console.error('❌ Error in getEmployeeFolders:', error);
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
      const { default: BackblazeService } = await import('./backblaze');

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
      const { default: BackblazeService } = await import('./backblaze');

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
} 

