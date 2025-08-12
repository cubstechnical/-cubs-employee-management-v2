import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Proxy stream from Backblaze using a reusable prefix token
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const filePath = url.searchParams.get('path')
  const prefix = url.searchParams.get('prefix')
  const token = url.searchParams.get('token')
  const downloadBase = url.searchParams.get('base')

  if (!filePath || !prefix || !token || !downloadBase) {
    return new Response('Missing params', { status: 400 })
  }

  // Ensure requested file is under the authorized prefix
  const decodedPath = decodeURIComponent(filePath)
  if (!decodedPath.startsWith(prefix)) {
    return new Response('Forbidden', { status: 403 })
  }

  const target = `${downloadBase}/file/cubsdocs/${encodeURI(decodedPath)}`
  const upstream = await fetch(target, {
    headers: { Authorization: token },
  })

  if (!upstream.ok) {
    return new Response(upstream.body, { status: upstream.status, headers: upstream.headers })
  }

  // Pass through body and important headers
  const headers = new Headers(upstream.headers)
  headers.set('Cache-Control', 'public, max-age=60, s-maxage=300')
  return new Response(upstream.body, { status: 200, headers })
}


