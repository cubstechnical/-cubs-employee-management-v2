import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';

// Edge function URL for document access
const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/doc-manager';

// Removed for static export compatibility

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

    log.info('Document view requested', { documentId });

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

    // For mobile apps and better document handling, redirect to the edge function
    // The edge function can handle authentication, access control, and proper document serving
    try {
      const edgeFunctionUrl = `${EDGE_FUNCTION_URL}?document_id=${documentId}&action=view`;

      log.info('Redirecting to edge function for document access', { documentId, edgeFunctionUrl });

      return NextResponse.redirect(edgeFunctionUrl, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (edgeError) {
      log.warn('Edge function not available, falling back to direct file URL', { documentId, error: edgeError });

      // Enhanced mobile/iPhone detection for ALL iPhone models
      const userAgent = request.headers.get('user-agent') || '';
      const isIPhone = /iPhone/.test(userAgent);
      const isIPad = /iPad/.test(userAgent);
      const isIPod = /iPod/.test(userAgent);
      const isIOSDevice = isIPhone || isIPad || isIPod;
      const isAndroid = /Android/.test(userAgent);
      const isMobile = /Mobile/i.test(userAgent);
      
      // Check for Capacitor app
      const isCapacitor = userAgent.includes('Capacitor');
      
      // Check for iOS app (not Safari browser)
      const isIOSApp = isIOSDevice && !/Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      
      // Check for WKWebView (Capacitor uses this)
      const isWKWebView = /AppleWebKit/.test(userAgent) && !/Safari/.test(userAgent) && isIOSDevice;
      
      // Check for iOS app indicators
      const hasIOSAppIndicators = /Mobile\/[A-Z0-9]+/.test(userAgent) && isIOSDevice;
      
      // Final mobile detection
      const isMobileApp = isIPhone || isIPad || isIPod || isAndroid || isMobile || isCapacitor || isIOSApp || isWKWebView || hasIOSAppIndicators;

      if (isMobileApp) {
        // For mobile apps, return the file URL as JSON for client-side handling
        return NextResponse.json({
          success: true,
          fileUrl: file_url,
          fileName: file_name,
          mimeType: mime_type,
          message: 'File URL provided for mobile app handling'
        });
      }

      // Fallback: redirect directly to file URL (works for public files)
      return NextResponse.redirect(file_url, {
        headers: {
          'Content-Type': mime_type || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${file_name}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

  } catch (error) {
    const resolvedParams = await params;
    log.error('Error in document view route', { error, documentId: resolvedParams.id });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
