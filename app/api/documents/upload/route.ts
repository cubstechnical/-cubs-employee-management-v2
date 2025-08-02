import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError } from '@/lib/api/middleware';
import { BackblazeService } from '@/lib/services/backblaze';
import { supabase } from '@/lib/supabase/client';

// POST /api/documents/upload - Upload document
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const formData = await req.formData();
      
      const employeeId = formData.get('employeeId') as string;
      const documentType = formData.get('documentType') as string;
      const fileName = formData.get('fileName') as string;
      const fileSize = parseInt(formData.get('fileSize') as string);
      const filePath = formData.get('filePath') as string;
      const notes = formData.get('notes') as string;
      const file = formData.get('file') as File;

      if (!employeeId || !documentType || !fileName || !filePath || !file) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Upload to Backblaze B2
      const uploadResult = await BackblazeService.uploadFile(file, {
        fileName,
        fileSize,
        mimeType: file.type,
        companyName: employeeId === 'company' ? 'Company Documents' : 'Employee Documents',
        employeeName: employeeId === 'company' ? 'Company' : employeeId,
        documentType
      });

      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error || 'Failed to upload file' },
          { status: 500 }
        );
      }

      // Save metadata to database
      const { data: document, error: dbError } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: employeeId,
          document_type: documentType,
          file_name: fileName,
          file_size: fileSize,
          file_path: filePath,
          file_type: fileName.split('.').pop() || 'unknown',
          file_url: uploadResult.fileUrl,
          notes: notes || null,
          uploaded_by: req.user.id
        })
        .select()
        .single();

      if (dbError) {
        // If database save fails, delete the uploaded file
        try {
          await BackblazeService.deleteFile(uploadResult.fileKey!);
        } catch (deleteError) {
          console.error('Failed to delete uploaded file after DB error:', deleteError);
        }

        return NextResponse.json(
          { error: 'Failed to save document metadata' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: document,
        message: 'Document uploaded successfully'
      }, { status: 201 });
    } catch (error) {
      console.error('Document upload error:', error);
      return handleApiError(error);
    }
  });
} 