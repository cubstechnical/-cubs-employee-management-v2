import { NextRequest, NextResponse } from 'next/server';
import { BackblazeService } from '@/lib/services/backblaze';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filePaths: string[] = Array.isArray(body?.filePaths) ? body.filePaths : [];
    const expiresIn: number = Number(body?.expiresIn) || 3600;

    if (!filePaths || filePaths.length === 0) {
      return NextResponse.json({ success: false, error: 'filePaths array is required' }, { status: 400 });
    }

    const unique = Array.from(new Set(filePaths.filter(Boolean)));

    const results = await Promise.all(
      unique.map(async (fp) => {
        try {
          const url = await BackblazeService.getPresignedUrl(fp, expiresIn);
          return { filePath: fp, previewUrl: url, error: null };
        } catch (e: any) {
          return { filePath: fp, previewUrl: null as string | null, error: e?.message || 'Failed to sign' };
        }
      })
    );

    return NextResponse.json({ success: true, data: { results, expiresIn } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal error' }, { status: 500 });
  }
}


