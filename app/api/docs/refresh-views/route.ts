import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get('authorization') || '';
    const expected = process.env.REFRESH_VIEWS_TOKEN || '';
    if (!expected || header !== `Bearer ${expected}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: res1, error: err1 } = await supabaseAdmin
      .rpc('refresh_company_document_folders_mv');

    const { data: res2, error: err2 } = await supabaseAdmin
      .rpc('refresh_employee_counts_by_company_mv');

    if (err1 || err2) {
      return NextResponse.json({ success: false, error: (err1 || err2)?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { res1, res2 } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to refresh views' }, { status: 500 });
  }
}


