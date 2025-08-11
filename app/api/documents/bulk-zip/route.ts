import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Streams a zip of selected document IDs; avoids client-side CORS and large parallel fetches
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
      if (!ids.length) {
        return NextResponse.json({ error: 'No document ids provided' }, { status: 400 });
      }

      // Look up documents
      const { data: docs, error } = await supabaseAdmin
        .from('employee_documents')
        .select('id, file_path, file_name')
        .in('id', ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Build signed URLs via Edge Function
      const signed: Array<{ name: string; url: string }> = [];
      for (const d of docs || []) {
        const { data: edgeResult, error: edgeError } = await supabaseAdmin.functions.invoke('doc-manager', {
          body: { action: 'getSignedUrl', directFilePath: d.file_path, fileName: d.file_name }
        });
        if (edgeError || !edgeResult?.success || !edgeResult?.signedUrl) continue;
        signed.push({ name: d.file_name, url: edgeResult.signedUrl });
      }

      if (!signed.length) {
        return NextResponse.json({ error: 'No downloadable documents found' }, { status: 404 });
      }

      // Stream zip using archiver
      const Archiver = (await import('archiver')).default;
      const { PassThrough } = await import('stream');
      const stream = new PassThrough();
      const archive = Archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err: any) => stream.destroy(err));
      archive.pipe(stream as any);

      // queue downloads
      const fetches = signed.map(async (f) => {
        const res = await fetch(f.url, { cache: 'no-store' });
        if (!res.ok || !res.body) return;
        archive.append(res.body as any, { name: f.name || 'file' });
      });

      (async () => {
        await Promise.all(fetches);
        await archive.finalize();
      })();

      return new NextResponse(stream as any, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="documents.zip"',
          'Cache-Control': 'no-store'
        }
      });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Failed to create zip' }, { status: 500 });
    }
  });
}


