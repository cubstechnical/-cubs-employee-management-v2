import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const manifest = {
    name: 'CUBS Technical - Employee Management',
    short_name: 'CUBS Admin',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111827',
    description: 'Comprehensive employee database and document management system for CUBS Technical',
    icons: [
      { src: '/assets/appicon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/assets/appicon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600, immutable'
    }
  });
}


