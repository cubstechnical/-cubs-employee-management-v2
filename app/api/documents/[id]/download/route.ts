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

    // Get presigned URL for download
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600, {
        download: document.file_name
      });

    if (urlError || !signedUrl) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate download URL'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl.signedUrl,
      filename: document.file_name
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to download document'
    }, { status: 500 });
  }
}
