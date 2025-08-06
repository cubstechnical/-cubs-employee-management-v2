import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/middleware';
import { BackblazeService } from '@/lib/services/backblaze';

// POST /api/documents/preview - Get document preview URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Generating preview URL for file path:', filePath);
    
    // Log Backblaze configuration for debugging
    console.log('🔧 Environment check:');
    console.log('- B2_ENDPOINT:', process.env.B2_ENDPOINT);
    console.log('- B2_BUCKET_NAME:', process.env.B2_BUCKET_NAME);
    console.log('- B2_APPLICATION_KEY_ID:', process.env.B2_APPLICATION_KEY_ID ? 'SET' : 'NOT SET');
    console.log('- B2_APPLICATION_KEY:', process.env.B2_APPLICATION_KEY ? 'SET' : 'NOT SET');
    
    BackblazeService.getConfig();
    
    // Try to generate presigned URL for secure access
    let previewUrl;
    try {
      previewUrl = await BackblazeService.getPresignedUrl(filePath, 3600); // 1 hour expiry
      console.log('✅ Presigned URL generated successfully');
    } catch (error) {
      console.log('⚠️ Presigned URL generation failed, using direct URL');
      // Fallback to direct URL construction
      const bucketName = process.env.B2_BUCKET_NAME || 'cubsdocs';
      previewUrl = `https://f005.backblazeb2.com/file/${bucketName}/${filePath}`;
      console.log('✅ Direct URL generated as fallback');
    }

    console.log('✅ Preview URL ready:', previewUrl.substring(0, 100) + '...');
    
    return NextResponse.json({
      success: true,
      data: {
        previewUrl,
        expiresIn: 3600
      }
    });
  } catch (error) {
    console.error('Document preview error:', error);
    return handleApiError(error);
  }
}

// GET /api/documents/preview - Get document download URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Generate presigned URL for download
    const downloadUrl = await BackblazeService.getPresignedUrl(filePath, 3600); // 1 hour expiry

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: 3600
      }
    });
  } catch (error) {
    console.error('Document download error:', error);
    return handleApiError(error);
  }
} 