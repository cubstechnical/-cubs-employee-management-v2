import { supabase } from '@/lib/supabase/client';

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
        .rpc('get_company_document_stats', {})
        .limit(50); // Limit to top 50 companies for faster loading

      if (statsError) {
        // Fallback to the old method if RPC fails
        console.log('⚠️ RPC failed, using fallback method');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('employee_documents')
          .select('file_path, uploaded_at')
          .not('file_path', 'is', null)
          .limit(500); // Reduced limit for better performance

        if (fallbackError) {
          return { folders: [], error: fallbackError.message };
        }

        // Process fallback data
        const companyData = new Map<string, { count: number; lastModified: string }>();
        
        if (fallbackData) {
          for (const doc of fallbackData) {
            const filePath = doc.file_path as string;
            const uploadedAt = doc.uploaded_at as string;
            
            if (filePath) {
              const pathParts = filePath.split('/');
              if (pathParts.length >= 1) {
                const companyName = pathParts[0];
                const existing = companyData.get(companyName);
                
                if (existing) {
                  existing.count++;
                  if (uploadedAt > existing.lastModified) {
                    existing.lastModified = uploadedAt;
                  }
                } else {
                  companyData.set(companyName, { count: 1, lastModified: uploadedAt });
                }
              }
            }
          }
        }

        return this.processCompanyData(companyData);
      }

      // Process RPC data
      const companyData = new Map<string, { count: number; lastModified: string }>();
      
      if (companyStats) {
        companyStats.forEach((stat: any) => {
          companyData.set(stat.company_name, {
            count: stat.document_count,
            lastModified: stat.last_modified
          });
        });
      }

      const result = this.processCompanyData(companyData);
      
      // Cache the result for better performance
      if (result.folders.length > 0) {
        this.foldersCache = {
          folders: result.folders,
          timestamp: Date.now()
        };
      }
      
      return result;
    } catch (error) {
      return { folders: [], error: 'Failed to fetch document folders' };
    }
  }

  // Helper method to process company data
  private static processCompanyData(companyData: Map<string, { count: number; lastModified: string }>): { folders: DocumentFolder[]; error: string | null } {

      // Create folders from actual data
      const folders: DocumentFolder[] = [];

      // Add Company Documents folder first
      const companyDocsCount = companyData.get('EMP_COMPANY_DOCS')?.count || 0;
      folders.push({
        id: 'company-documents',
        name: 'Company Documents',
        type: 'company',
        documentCount: companyDocsCount,
        lastModified: companyData.get('EMP_COMPANY_DOCS')?.lastModified || new Date().toISOString(),
        path: '/company-documents'
      });

      // Add company folders with proper display names - HANDLE AL HANA TOURS SEPARATELY
      Array.from(companyData.entries()).forEach(([companyName, data]) => {
        // Skip EMP_COMPANY_DOCS as it's handled separately
        if (companyName === 'EMP_COMPANY_DOCS') {
          return;
        }
        
        // Handle AL HANA TOURS & TRAVELS employee folders - group them together
        if (companyName.startsWith('EMP_ALHT')) {
          // This is an AL HANA TOURS employee folder - skip individual folders
          return;
        }
        
                // Include all company folders (RUKIN_AL_ASHBAL, AL MACEN, CUBS, etc.)
        // The filtering logic was incorrect - we want to show all companies
        // Only skip EMP_COMPANY_DOCS (handled separately) and EMP_ALHT (handled specially)
        
        // Map file path company names to display names
        let displayName = companyName;
        switch (companyName) {
          case 'RUKIN_AL_ASHBAL':
            displayName = 'RUKIN AL ASHBAL';
            break;
          case 'AL_ASHBAL_AJMAN':
            displayName = 'AL ASHBAL AJMAN';
            break;
          case 'ASHBAL_AL_KHALEEJ':
            displayName = 'ASHBAL AL KHALEEJ';
            break;
          case 'FLUID_ENGINEERING':
            displayName = 'FLUID ENGINEERING';
            break;
          case 'GOLDEN_CUBS':
            displayName = 'GOLDEN CUBS';
            break;
          case 'CUBS_TECH':
            displayName = 'CUBS TECH';
            break;
          case 'AL MACEN':
            displayName = 'AL MACEN';
            break;
          case 'CUBS':
            displayName = 'CUBS CONTRACTING';
            break;
          default:
            displayName = companyName.replace(/_/g, ' ');
        }

        folders.push({
          id: `company-${companyName}`,
          name: displayName,
          type: 'company' as const,
          companyName,
          documentCount: data.count,
          lastModified: data.lastModified,
          path: `/company/${companyName}`
        });
      });

      // Add AL HANA TOURS & TRAVELS with actual document count
      const alHanaDocCount = (companyData.get('EMP_ALHT0001')?.count || 0) +
                            (companyData.get('EMP_ALHT0002')?.count || 0) +
                            (companyData.get('EMP_ALHT0003')?.count || 0) +
                            (companyData.get('EMP_ALHT0004')?.count || 0) +
                            (companyData.get('EMP_ALHT0005')?.count || 0);

      const alHanaLastModified = Math.max(
        new Date(companyData.get('EMP_ALHT0001')?.lastModified || 0).getTime(),
        new Date(companyData.get('EMP_ALHT0002')?.lastModified || 0).getTime(),
        new Date(companyData.get('EMP_ALHT0003')?.lastModified || 0).getTime(),
        new Date(companyData.get('EMP_ALHT0004')?.lastModified || 0).getTime(),
        new Date(companyData.get('EMP_ALHT0005')?.lastModified || 0).getTime()
      );

      if (alHanaDocCount > 0) {
        folders.push({
          id: 'company-al-hana-tours',
          name: 'AL HANA TOURS & TRAVELS',
          type: 'company' as const,
          companyName: 'AL_HANA_TOURS_TRAVELS',
          documentCount: alHanaDocCount,
          lastModified: alHanaLastModified > 0 ? new Date(alHanaLastModified).toISOString() : new Date().toISOString(),
          path: '/company/AL_HANA_TOURS_TRAVELS'
        });
      }

      return { folders, error: null };
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

      // Create a map of employee_id to employee name
      const employeeNameMap = new Map<string, string>();
      employees?.forEach(emp => {
        employeeNameMap.set(emp.employee_id as string, emp.name as string);
      });

      // Group documents by employee_id - PERFORMANCE OPTIMIZED
      const employeeMap = new Map<string, { count: number; lastModified: string; employeeId: string }>();
      
      if (companyDocs) {
        for (const doc of companyDocs) {
          const uploadedAt = doc.uploaded_at as string;
          const employeeId = doc.employee_id as string;
          
          if (uploadedAt && employeeId) {
            const existing = employeeMap.get(employeeId);
            
            if (existing) {
              existing.count++;
              if (uploadedAt > existing.lastModified) {
                existing.lastModified = uploadedAt;
              }
            } else {
              employeeMap.set(employeeId, { 
                count: 1, 
                lastModified: uploadedAt, 
                employeeId: employeeId
              });
            }
          }
        }
      }

      // Create folders using employee names from database
      const folders: DocumentFolder[] = Array.from(employeeMap.entries()).map(([employeeId, data]) => {
        const employeeName = employeeNameMap.get(employeeId) || employeeId; // Fallback to employee_id if name not found
        
        return {
          id: `emp-${employeeId}`,
          name: employeeName, // Use real employee name from database
          type: 'employee' as const,
          employeeId: employeeId,
          employeeName: employeeName,
          companyName: companyName,
          documentCount: data.count,
          lastModified: data.lastModified,
          path: `/company/${companyName}/employee/${employeeId}` // Use employee_id in path
        };
      });

      // Sort folders by employee name for better UX
      folders.sort((a, b) => a.name.localeCompare(b.name));

      return { folders, error: null };
    } catch (error) {
      return { folders: [], error: 'Failed to fetch employee folders' };
    }
  }

  // Upload document to Backblaze and save metadata to Supabase
  static async uploadDocument(
    file: File,
    uploadData: UploadDocumentData
  ): Promise<{ document: Document | null; error: string | null }> {
    try {
      // Import BackblazeService dynamically to avoid SSR issues
      const { default: BackblazeService } = await import('./backblaze');
      
      // Extract company and employee from file path
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
        documentType: uploadData.document_type,
      });

      if (!uploadResult.success) {
        return { document: null, error: uploadResult.error || 'Upload failed' };
      }

      // Create document record
      const document: Document = {
        id: `doc-${Date.now()}`,
        employee_id: uploadData.employee_id,
        document_type: uploadData.document_type,
        file_name: uploadData.file_name,
        file_url: uploadResult.fileUrl!,
        file_size: uploadData.file_size,
        file_path: uploadData.file_path,
        file_type: uploadData.file_type,
        uploaded_at: new Date().toISOString(),
        uploaded_by: undefined,
        is_active: true,
        notes: uploadData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        mime_type: file.type,
        document_number: undefined,
        issuing_authority: undefined,
        expiry_date: undefined
      };

      // Save metadata to Supabase
      const { data, error } = await supabase
        .from('employee_documents')
        .insert([document as any])
        .select()
        .single();

      if (error) {
        // If Supabase insert fails, delete the uploaded file
        await BackblazeService.deleteFile(uploadResult.fileKey!);
        return { document: null, error: error.message };
      }

      return { document: data as unknown as Document, error: null };
    } catch (error) {
      console.error('Upload document error:', error);
      return { document: null, error: 'Failed to upload document' };
    }
  }

  // Delete document from Backblaze and Supabase
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

