import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/documents';
import { BackblazeService } from '@/lib/services/backblaze';

// Use Node.js runtime to allow AWS SDK
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/documents/[id]/download - Download document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('⬇️ Downloading document:', params.id);
    
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
    console.log('✅ Document found for download:', document.file_name);

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

    // Set headers for download
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${document.file_name}"`);
    headers.set('Content-Type', document.file_type || 'application/octet-stream');

    // Redirect to download URL
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('❌ Error downloading document:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
