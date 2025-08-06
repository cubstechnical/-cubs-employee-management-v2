import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError } from '@/lib/api/middleware';
import { FileUploadService } from '@/lib/services/fileUpload';

// GET /api/documents/[id] - Get document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const document = await FileUploadService.getDocumentById(params.id);

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      // Generate signed download URL
      const downloadUrl = await FileUploadService.getSignedDownloadUrl(document.file_url);

      return NextResponse.json({
        success: true,
        data: {
          ...document,
          download_url: downloadUrl,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// PUT /api/documents/[id] - Update document metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      const updates = {
        name: body.name,
        type: body.type,
      };

      const document = await FileUploadService.updateDocumentMetadata(params.id, updates);

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found or update failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: document,
        message: 'Document updated successfully',
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const success = await FileUploadService.deleteDocument(params.id);

      if (!success) {
        return NextResponse.json(
          { error: 'Document not found or delete failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
} 
 