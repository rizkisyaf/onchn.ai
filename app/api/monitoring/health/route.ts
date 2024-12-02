import { NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/services/monitoring';
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';
import { rateLimit } from '@/lib/middleware/rateLimit';

const monitoring = new MonitoringService();
const redis = new Redis(process.env.REDIS_URL!);

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedisConnection() {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(req, 'health');
    if (rateLimitResult) return rateLimitResult;

    const startTime = Date.now();

    // Check all dependencies
    const [dbStatus, redisStatus, systemHealth] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection(),
      monitoring.getSystemHealth(),
    ]);

    const duration = Date.now() - startTime;

    // Track API latency
    await monitoring.trackApiCall('/api/monitoring/health', 'GET', duration / 1000);

    const status = dbStatus && redisStatus ? 'healthy' : 'degraded';

    const response = {
      status,
      timestamp: new Date(),
      duration: `${duration}ms`,
      dependencies: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected',
      },
      system: systemHealth.system,
    };

    if (status === 'degraded') {
      monitoring.logWarning('Health check detected degraded service', {
        dependencies: {
          database: dbStatus,
          redis: redisStatus,
        },
      });
    }

    return NextResponse.json(response, {
      status: status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    monitoring.logError(error as Error, {
      context: 'health-check',
      endpoint: '/api/monitoring/health',
    });

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
} 