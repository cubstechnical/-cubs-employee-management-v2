import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError } from '@/lib/api/middleware';
import { BackblazeService } from '@/lib/services/backblaze';

// POST /api/documents/preview - Get document preview URL
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      const { filePath } = body;

      if (!filePath) {
        return NextResponse.json(
          { error: 'File path is required' },
          { status: 400 }
        );
      }

      // Generate presigned URL for secure access
      const previewUrl = await BackblazeService.getPresignedUrl(filePath, 3600); // 1 hour expiry

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
  });
}

// GET /api/documents/preview - Get document download URL
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
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
  });
} 