import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export const runtime = 'edge'

export async function POST(_req: NextRequest) {
  try {
    // Requires a service role in server env; if anon, this will be RLS-blocked in prod
    const { error: err1 } = await supabase.rpc('refresh_company_document_folders_mv')
    const { error: err2 } = await supabase.rpc('refresh_employee_counts_by_company_mv')
    if (err1 || err2) {
      return NextResponse.json({ success: false, error: err1?.message || err2?.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to refresh views' }, { status: 500 })
  }
}

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


