import { NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/services/monitoring';
import { getServerSession } from 'next-auth';
import { rateLimit } from '@/lib/middleware/rateLimit';

const monitoring = new MonitoringService();

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimit(req, 'metrics');
    if (rateLimitResult) return rateLimitResult;

    const startTime = Date.now();
    const metrics = await monitoring.getMetrics();
    const duration = Date.now() - startTime;

    // Track API latency
    await monitoring.trackApiCall('/api/monitoring/metrics', 'GET', duration / 1000);

    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    monitoring.logError(error as Error, {
      context: 'metrics-api',
      endpoint: '/api/monitoring/metrics',
    });
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 