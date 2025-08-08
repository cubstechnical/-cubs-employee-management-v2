import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({ success: true, settings: {} });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: body });
  } catch (_e) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}
