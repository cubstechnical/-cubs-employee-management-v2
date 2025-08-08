import { NextRequest, NextResponse } from 'next/server';

// GET /api/email-templates - return empty list placeholder
export async function GET(_request: NextRequest) {
  return NextResponse.json({ success: true, templates: [] });
}

// POST /api/email-templates - echo payload placeholder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}
