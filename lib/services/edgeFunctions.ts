import { supabase } from '../supabase/client';

export interface UploadDocumentData {
  file: File;
  employeeId: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  notes?: string;
}

export interface DownloadDocumentData {
  filePath: string;
  fileName: string;
}

export interface DeleteDocumentData {
  filePath: string;
  documentId: string;
}

export class EdgeFunctionService {
  // Upload document using Edge Function
  static async uploadDocument(data: UploadDocumentData): Promise<{ success: boolean; error?: string; fileUrl?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('employeeId', data.employeeId);
      formData.append('documentType', data.documentType);
      formData.append('fileName', data.fileName);
      formData.append('fileSize', data.fileSize.toString());
      formData.append('filePath', data.filePath);
      if (data.notes) {
        formData.append('notes', data.notes);
      }

      const { data: result, error } = await supabase.functions.invoke('doc-manager', {
        method: 'POST',
        body: formData
      });

      if (error) {
        console.error('Edge function upload error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, fileUrl: result?.fileUrl };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Failed to upload document' };
    }
  }

  // Download document using Edge Function
  static async downloadDocument(data: DownloadDocumentData): Promise<{ success: boolean; error?: string; downloadUrl?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('doc-manager', {
        method: 'GET',
        body: {
          action: 'download',
          filePath: data.filePath,
          fileName: data.fileName
        }
      });

      if (error) {
        console.error('Edge function download error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, downloadUrl: result?.downloadUrl };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: 'Failed to download document' };
    }
  }

  // Delete document using Edge Function
  static async deleteDocument(data: DeleteDocumentData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('doc-manager', {
        method: 'DELETE',
        body: {
          action: 'delete',
          filePath: data.filePath,
          documentId: data.documentId
        }
      });

      if (error) {
        console.error('Edge function delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: 'Failed to delete document' };
    }
  }

  // Check visa expiry notifications using Edge Function
  static async checkVisaExpiryNotifications(): Promise<{ success: boolean; error?: string; notifications?: any[] }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-visa-notifications', {
        method: 'POST',
        body: {
          action: 'check-expiry'
        }
      });

      if (error) {
        console.error('Edge function visa check error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notifications: result?.notifications };
    } catch (error) {
      console.error('Visa check error:', error);
      return { success: false, error: 'Failed to check visa notifications' };
    }
  }

  // Get document preview URL
  static async getDocumentPreview(filePath: string): Promise<{ success: boolean; error?: string; previewUrl?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('doc-manager', {
        method: 'GET',
        body: {
          action: 'preview',
          filePath: filePath
        }
      });

      if (error) {
        console.error('Edge function preview error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, previewUrl: result?.previewUrl };
    } catch (error) {
      console.error('Preview error:', error);
      return { success: false, error: 'Failed to get document preview' };
    }
  }
} 