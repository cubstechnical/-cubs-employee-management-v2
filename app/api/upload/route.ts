import { NextRequest, NextResponse } from 'next/server';
import { BackblazeService } from '@/lib/services/backblaze';
import { log } from '@/lib/utils/productionLogger';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Note: This route is a fallback for browser-side uploads
    // Main upload route is /api/documents/upload which handles authentication

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const metadata = formData.get('metadata');

    if (!file || !metadata) {
      return NextResponse.json(
        { error: 'File and metadata are required' },
        { status: 400 }
      );
    }

    // Parse metadata
    const uploadData = JSON.parse(metadata as string);
    
    // Upload file to Backblaze
    const result = await BackblazeService.uploadFile(file, {
      fileName: uploadData.fileName || file.name,
      fileSize: uploadData.fileSize || file.size,
      mimeType: uploadData.fileType || file.type,
      companyName: uploadData.companyName || 'CUBS',
      employeeName: uploadData.employeeName || 'unknown',
      documentType: uploadData.documentType || 'document',
    });

    if (!result.success) {
      log.error('❌ Backblaze upload failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    log.error('❌ Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
// This is required for file uploads from the browser
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
