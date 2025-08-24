import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const supabase = createClient(url, key, { auth: { persistSession: false } });

    // Create auth user
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin' },
    });
    if (createErr || !created?.user) return NextResponse.json({ error: createErr?.message || 'createUser failed' }, { status: 400 });

    const approver = created.user.id; // self-approve if no existing admin flow

    // Upsert profile
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: created.user.id,
      email,
      full_name: email,
      role: 'admin',
      approved_by: approver,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

