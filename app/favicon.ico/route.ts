import { NextResponse } from 'next/server'

export async function GET() {
  // 1x1 transparent PNG fallback to avoid 404s when favicon is missing
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFVQJ3A0rNBgAAAABJRU5ErkJggg=='
  const buffer = Buffer.from(pngBase64, 'base64')
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}

export const dynamic = 'force-static'

