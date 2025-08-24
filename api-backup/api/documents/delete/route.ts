import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError } from '@/lib/api/middleware';
import { BackblazeService } from '@/lib/services/backblaze';
import { supabase } from '@/lib/supabase/client';

// DELETE /api/documents/delete - Delete document
export async function DELETE(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      const { filePath, documentId } = body;

      if (!filePath || !documentId) {
        return NextResponse.json(
          { error: 'File path and document ID are required' },
          { status: 400 }
        );
      }

      // Delete from Backblaze B2
      const deleteResult = await BackblazeService.deleteFile(filePath);
      
      if (!deleteResult.success) {
        console.error('Failed to delete from Backblaze:', deleteResult.error);
        return NextResponse.json(
          { error: 'Failed to delete file from storage' },
          { status: 500 }
        );
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('Failed to delete from database:', dbError);
        return NextResponse.json(
          { error: 'Failed to delete document record' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Document delete error:', error);
      return handleApiError(error);
    }
  });
} 