import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Get document details from database
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return NextResponse.json({
        success: false,
        error: 'Document not found'
      }, { status: 404 });
    }

    // Get presigned URL for the document
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (urlError || !signedUrl) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate document URL'
      }, { status: 500 });
    }

    // For mobile devices, redirect to the document URL
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (isMobile) {
      // For mobile, redirect to the document URL
      return NextResponse.redirect(signedUrl.signedUrl);
    }

    // For desktop, return the URL for opening in new tab
    return NextResponse.json({
      success: true,
      url: signedUrl.signedUrl,
      document: {
        id: document.id,
        name: document.file_name,
        type: document.mime_type,
        size: document.file_size
      }
    });
  } catch (error) {
    console.error('Error viewing document:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to view document'
    }, { status: 500 });
  }
}
