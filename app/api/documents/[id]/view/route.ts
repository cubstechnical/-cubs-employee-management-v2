import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/documents';
import { BackblazeService } from '@/lib/services/backblaze';

// Use Node.js runtime to allow AWS SDK
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/documents/[id]/view - View document in browser
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('👁️ Viewing document:', params.id);
    
    // Get document from database
    const { documents, error } = await DocumentService.getDocumentById(params.id);
    
    if (error || !documents || documents.length === 0) {
      console.error('❌ Document not found:', params.id);
      return new NextResponse('Document not found', { status: 404 });
    }

    const document = documents[0];
    console.log('✅ Document found for viewing:', document.file_name);

    // Generate signed URL for viewing
    let viewUrl;
    try {
      viewUrl = await BackblazeService.getPresignedUrl(document.file_path, 3600);
      console.log('✅ Generated signed URL for viewing');
    } catch (error) {
      console.warn('⚠️ Failed to generate signed URL, using direct URL');
      const bucketName = process.env.B2_BUCKET_NAME || 'cubsdocs';
      viewUrl = `https://f005.backblazeb2.com/file/${bucketName}/${document.file_path}`;
    }

    // Redirect to the actual file URL to view in browser
    return NextResponse.redirect(viewUrl);
  } catch (error) {
    console.error('❌ Error viewing document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
