import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '../supabase/client';
import { log } from '@/lib/utils/productionLogger';

// Initialize S3 client for Backblaze B2
const s3Client = new S3Client({
  region: 'us-west-002', // Backblaze B2 region
  endpoint: `https://s3.us-west-002.backblazeb2.com`,
  credentials: {
    accessKeyId: process.env.BACKBLAZE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_SECRET_ACCESS_KEY!,
  },
});

export interface UploadedFile {
  id: string;
  employee_id: string;
  name: string;
  type: 'passport' | 'visa' | 'contract' | 'id_card' | 'other';
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface FileUploadRequest {
  employee_id: string;
  name: string;
  type: 'passport' | 'visa' | 'contract' | 'id_card' | 'other';
  file: File;
  uploaded_by: string;
}

export class FileUploadService {
  static async uploadFile(request: FileUploadRequest): Promise<UploadedFile | null> {
    try {
      const { employee_id, name, type, file, uploaded_by } = request;
      
      // Generate unique file key
      const fileKey = `documents/${employee_id}/${Date.now()}-${file.name}`;
      
      // Upload to Backblaze B2
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.BACKBLAZE_BUCKET_NAME!,
        Key: fileKey,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'employee-id': employee_id,
          'document-type': type,
          'uploaded-by': uploaded_by,
        },
      });

      await s3Client.send(uploadCommand);

      // Generate file URL
      const fileUrl = `https://${process.env.BACKBLAZE_BUCKET_NAME}.s3.us-west-002.backblazeb2.com/${fileKey}`;

      // Store metadata in Supabase
      const { data: document, error } = await (supabase as any)
        .from('documents')
        .insert({
          employee_id,
          name,
          type,
          file_url: fileUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by,
        })
        .select()
        .single();

      if (error) {
        log.error('Error storing document metadata:', error);
        // Clean up uploaded file if metadata storage fails
        await this.deleteFile(fileKey);
        return null;
      }

      return document as unknown as UploadedFile;
    } catch (error) {
      log.error('Error uploading file:', error);
      return null;
    }
  }

  static async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BACKBLAZE_BUCKET_NAME!,
        Key: fileKey,
      });

      await s3Client.send(deleteCommand);
      return true;
    } catch (error) {
      log.error('Error deleting file:', error);
      return false;
    }
  }

  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Get document metadata
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        log.error('Document not found:', fetchError);
        return false;
      }

      // Extract file key from URL
      const fileKey = ((document as any).file_url as string).split('.com/')[1];
      
      // Delete from Backblaze B2
      const deleted = await this.deleteFile(fileKey);
      
      if (!deleted) {
        log.error('Failed to delete file from Backblaze B2');
        return false;
      }

      // Delete metadata from Supabase
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        log.error('Error deleting document metadata:', deleteError);
        return false;
      }

      return true;
    } catch (error) {
      log.error('Error deleting document:', error);
      return false;
    }
  }

  static async getSignedDownloadUrl(fileUrl: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      // Extract file key from URL
      const fileKey = fileUrl.split('.com/')[1];
      
      const command = new GetObjectCommand({
        Bucket: process.env.BACKBLAZE_BUCKET_NAME!,
        Key: fileKey,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      log.error('Error generating signed URL:', error);
      return null;
    }
  }

  static async getDocumentsByEmployee(employeeId: string): Promise<UploadedFile[]> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Error fetching documents:', error);
        return [];
      }

      return documents as unknown as UploadedFile[];
    } catch (error) {
      log.error('Error fetching documents:', error);
      return [];
    }
  }

  static async getDocumentById(documentId: string): Promise<UploadedFile | null> {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        log.error('Error fetching document:', error);
        return null;
      }

      return document as unknown as UploadedFile;
    } catch (error) {
      log.error('Error fetching document:', error);
      return null;
    }
  }

  static async updateDocumentMetadata(
    documentId: string,
    updates: Partial<Pick<UploadedFile, 'name' | 'type'>>
  ): Promise<UploadedFile | null> {
    try {
      const { data: document, error } = await (supabase as any)
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        log.error('Error updating document metadata:', error);
        return null;
      }

      return document as unknown as UploadedFile;
    } catch (error) {
      log.error('Error updating document metadata:', error);
      return null;
    }
  }

  static async getDocumentsByType(type: string): Promise<UploadedFile[]> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Error fetching documents by type:', error);
        return [];
      }

      return documents as unknown as UploadedFile[];
    } catch (error) {
      log.error('Error fetching documents by type:', error);
      return [];
    }
  }

  static async getDocumentStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*');

      if (error) {
        log.error('Error fetching document stats:', error);
        return { total: 0, byType: {}, totalSize: 0 };
      }

      const stats = {
        total: documents?.length || 0,
        byType: {} as Record<string, number>,
        totalSize: 0,
      };

      documents?.forEach(doc => {
        stats.totalSize += ((doc as any).file_size as number) || 0;
        stats.byType[(doc as any).type as string] = (stats.byType[(doc as any).type as string] || 0) + 1;
      });

      return stats;
    } catch (error) {
      log.error('Error fetching document stats:', error);
      return { total: 0, byType: {}, totalSize: 0 };
    }
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed. Please upload PDF, JPG, PNG, or DOC files only.' };
    }

    return { valid: true };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 