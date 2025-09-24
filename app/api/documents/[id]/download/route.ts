import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/log';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    log.info('Document download requested', { documentId });

    // Get document from database
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      log.error('Document not found', { documentId, error });
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document has a file URL
    if (!document.file_url) {
      log.error('Document has no file URL', { documentId });
      return NextResponse.json(
        { success: false, error: 'Document file not found' },
        { status: 404 }
      );
    }

    const fileUrl = document.file_url;
    const fileName = document.file_name || `document-${documentId}`;

    log.info('Document download redirect', { documentId, fileUrl, fileName });

    try {
      // Try to fetch the file from the external URL
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'CUBS-Employee-Management/1.0',
        },
      });

      if (!response.ok) {
        log.error('Failed to fetch file from external URL', {
          documentId,
          status: response.status,
          statusText: response.statusText
        });

        // Fallback: redirect to external URL
        return NextResponse.redirect(fileUrl);
      }

      // Get the file blob
      const blob = await response.blob();

      // Return the file with appropriate headers
      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': document.mime_type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

    } catch (fetchError) {
      log.error('Error fetching file from external URL', { documentId, error: fetchError });

      // Fallback: redirect to external URL
      return NextResponse.redirect(fileUrl);
    }

  } catch (error) {
    log.error('Error in document download route', { error, documentId: params.id });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
