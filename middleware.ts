import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

try {
  // Only initialize rate limiter if Redis URL is configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(
        Number(process.env.RATE_LIMIT_REQUESTS) || 100,
        `${Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000}ms`
      ),
    })
  }
} catch (error) {
  console.warn('Failed to initialize rate limiter:', error)
}

// Define paths that should be rate limited
const RATE_LIMITED_PATHS = [
  '/api/wallet',
  '/api/trade',
  '/api/analysis',
]

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const path = request.nextUrl.pathname

  // Skip rate limiting for non-API routes
  if (!RATE_LIMITED_PATHS.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }

  // Check API key
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid API key' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  // Skip rate limiting if not configured
  if (!ratelimit) {
    console.warn('Rate limiting is not configured')
    return NextResponse.next()
  }

  // Rate limiting
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${ip}`
  )

  if (!success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        limit,
        remaining: 0,
        reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Add rate limit headers to successful requests
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())

  return response
}

export const config = {
  matcher: '/api/:path*',
} 