import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const q = (searchParams.get('q') || '').trim();
      const type = searchParams.get('type') || '';
      const from = searchParams.get('from') || '';
      const to = searchParams.get('to') || '';
      const company = searchParams.get('company') || '';
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 200);

      let query = supabaseAdmin
        .from('employee_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (q) {
        // Use ILIKE on both name and path; if pg_trgm enabled, db will use trigram indexes
        query = query.or(`file_name.ilike.%${q}%,file_path.ilike.%${q}%`);
      }
      if (type) {
        query = query.eq('document_type', type);
      }
      if (company) {
        query = query.ilike('file_path', `${company}/%`);
      }
      if (from) {
        query = query.gte('uploaded_at', from);
      }
      if (to) {
        query = query.lte('uploaded_at', to);
      }

      const rangeFrom = (page - 1) * pageSize;
      const rangeTo = rangeFrom + pageSize - 1;
      const { data, error } = await query.range(rangeFrom, rangeTo);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ results: data || [], page, pageSize });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Search failed' }, { status: 500 });
    }
  });
}


