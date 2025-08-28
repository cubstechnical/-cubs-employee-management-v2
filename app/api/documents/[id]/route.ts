import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/documents';
import { BackblazeService } from '@/lib/services/backblaze';
import { handleApiError } from '@/lib/api/middleware';

// Use Node.js runtime to allow AWS SDK
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/documents/[id] - Get document by ID with download URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Getting document by ID:', params.id);
    
    // Get document from database
    const { documents, error } = await DocumentService.getDocumentById(params.id);
    
    if (error || !documents || documents.length === 0) {
      console.error('❌ Document not found:', params.id);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const document = documents[0];
    console.log('✅ Document found:', document.file_name);

    // Generate signed download URL
    let downloadUrl;
    try {
      downloadUrl = await BackblazeService.getPresignedUrl(document.file_path, 3600);
      console.log('✅ Generated signed URL for download');
    } catch (error) {
      console.warn('⚠️ Failed to generate signed URL, using direct URL');
      const bucketName = process.env.B2_BUCKET_NAME || 'cubsdocs';
      downloadUrl = `https://f005.backblazeb2.com/file/${bucketName}/${document.file_path}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        download_url: downloadUrl,
      },
    });
  } catch (error) {
    console.error('❌ Error getting document:', error);
    return handleApiError(error);
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Deleting document:', params.id);
    
    const success = await DocumentService.deleteDocument(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Document not found or delete failed' },
        { status: 404 }
      );
    }

    console.log('✅ Document deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    return handleApiError(error);
  }
}
