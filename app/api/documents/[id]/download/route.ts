import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';

// Edge function URL for document access
const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/doc-manager';

// Required for static export
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    log.info('Document download requested', { documentId });

    // Get document metadata from database - try both tables
    let data = null;
    let error = null;

    // First try employee_documents table (primary storage)
    const { data: empDocData, error: empDocError } = await supabase
      .from('employee_documents')
      .select('file_url, file_name, mime_type, file_path, employee_id')
      .eq('id', documentId)
      .single();

    if (empDocData && !empDocError) {
      data = empDocData;
      error = null;
    } else {
      // Fallback to documents table (legacy storage)
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('file_url, file_name, mime_type, file_path, employee_id')
        .eq('id', documentId)
        .single();

      data = docData;
      error = docError;
    }

    if (error || !data) {
      log.error('Document not found or database error', { documentId, error: error?.message });
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    const { file_url, file_name, mime_type, file_path } = data;

    if (!file_url) {
      log.error('Document file_url is missing', { documentId });
      return NextResponse.json(
        { success: false, error: 'Document URL is missing' },
        { status: 404 }
      );
    }

    // For download, redirect to the edge function with download action
    try {
      const edgeFunctionUrl = `${EDGE_FUNCTION_URL}?document_id=${documentId}&action=download`;

      log.info('Redirecting to edge function for document download', { documentId, edgeFunctionUrl });

      return NextResponse.redirect(edgeFunctionUrl, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (edgeError) {
      log.warn('Edge function not available, falling back to direct file URL', { documentId, error: edgeError });

      // Fallback: redirect directly to file URL with download headers
      return NextResponse.redirect(file_url, {
        headers: {
          'Content-Type': mime_type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file_name}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

  } catch (error) {
    const resolvedParams = await params;
    log.error('Error in document download route', { error, documentId: resolvedParams.id });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
