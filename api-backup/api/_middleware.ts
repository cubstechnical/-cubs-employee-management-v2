import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight rate limiter per IP using in-memory token bucket (for serverless, this is per instance)
const buckets = new Map<string, { tokens: number; lastRefill: number }>();
const CAPACITY = 60; // 60 requests
const REFILL_MS = 60_000; // per minute

export function middleware(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const b = buckets.get(ip) || { tokens: CAPACITY, lastRefill: now };
  // refill
  const elapsed = now - b.lastRefill;
  if (elapsed > REFILL_MS) {
    const refill = Math.floor(elapsed / REFILL_MS) * CAPACITY;
    b.tokens = Math.min(CAPACITY, b.tokens + refill);
    b.lastRefill = now;
  }
  if (b.tokens <= 0) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};


