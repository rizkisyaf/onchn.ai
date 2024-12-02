import { Redis } from 'ioredis';
import { NextResponse } from 'next/server';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { MonitoringService } from '../services/monitoring';

const redis = new Redis(process.env.REDIS_URL!);
const monitoring = new MonitoringService();

// Rate limiter configurations
const rateLimiters = {
  default: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'ratelimit:default',
    points: 100, // Number of points
    duration: 60, // Per 60 seconds
  }),
  agent: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'ratelimit:agent',
    points: 50, // Number of points
    duration: 60, // Per 60 seconds
  }),
  memory: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'ratelimit:memory',
    points: 200, // Number of points
    duration: 60, // Per 60 seconds
  }),
  chat: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'ratelimit:chat',
    points: 300, // Number of points
    duration: 60, // Per 60 seconds
  }),
};

export async function rateLimit(
  req: Request,
  endpoint: string
): Promise<NextResponse | null> {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimiter = rateLimiters[endpoint as keyof typeof rateLimiters] || rateLimiters.default;

  try {
    await rateLimiter.consume(ip);
    return null;
  } catch (error) {
    monitoring.logWarning('Rate limit exceeded', {
      ip,
      endpoint,
      error,
    });

    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((error as any).msBeforeNext / 1000),
      }),
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((error as any).msBeforeNext / 1000).toString(),
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function getRateLimitInfo(ip: string, endpoint: string) {
  const rateLimiter = rateLimiters[endpoint as keyof typeof rateLimiters] || rateLimiters.default;
  try {
    const result = await rateLimiter.get(ip);
    return {
      remainingPoints: result ? rateLimiter.points - result.consumedPoints : rateLimiter.points,
      msBeforeNext: result ? result.msBeforeNext : 0,
      isBlocked: result ? result.consumedPoints >= rateLimiter.points : false,
    };
  } catch (error) {
    monitoring.logError(error as Error, {
      context: 'getRateLimitInfo',
      ip,
      endpoint,
    });
    return null;
  }
}

export async function resetRateLimit(ip: string, endpoint: string) {
  const rateLimiter = rateLimiters[endpoint as keyof typeof rateLimiters] || rateLimiters.default;
  try {
    await rateLimiter.delete(ip);
    monitoring.logInfo('Rate limit reset', {
      ip,
      endpoint,
    });
    return true;
  } catch (error) {
    monitoring.logError(error as Error, {
      context: 'resetRateLimit',
      ip,
      endpoint,
    });
    return false;
  }
} 