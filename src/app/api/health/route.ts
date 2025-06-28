import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/api-logging';
import { PerformanceMonitor } from '@/lib/monitoring';
import { log } from '@/lib/logger';

async function healthCheck(request: NextRequest) {
  const monitor = new PerformanceMonitor('health_check');

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'team-spark-ai',
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      server: true,
      database: false,
    },
    metrics: {
      dbResponseTime: 0,
    },
  };

  // Database connection check
  try {
    const dbMonitor = new PerformanceMonitor('db_health_check');
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = true;
    health.metrics.dbResponseTime = dbMonitor.end();
  } catch (error) {
    log.error('Database connection failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
  }

  const httpStatus = health.checks.database ? 200 : 503;
  monitor.end({ status: health.checks.database ? 'healthy' : 'unhealthy' });

  return NextResponse.json(health, { status: httpStatus });
}

export const GET = withLogging(healthCheck, {
  routeName: 'health',
  skipLogging: false,
});
