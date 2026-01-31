import { NextRequest, NextResponse } from 'next/server';
import { BackblazeService } from '@/lib/services/backblaze';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate the user before allowing uploads
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      log.warn('⚠️ Missing Authorization header for /api/upload');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      log.warn('⚠️ Invalid authentication tokens for /api/upload:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication credentials' },
        { status: 401 }
      );
    }

    log.info('📋 Authenticated upload request from user:', user.email);

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
export async function OPTIONS(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('Origin') || '';

  // List of allowed origins (add your domains here)
  const allowedOrigins = [
    'https://cubsgroups.com',
    'https://www.cubsgroups.com',
    'https://cubs-employee-management.vercel.app',
    'http://localhost:3000',
    'capacitor://localhost', // iOS
    'http://localhost', // Android
  ];

  // Check if origin is allowed
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

