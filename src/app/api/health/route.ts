import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'team-spark-ai',
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      server: true,
      database: false,
    },
  };

  // Database connection check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = true;
  } catch (error) {
    console.error('Database connection failed:', error);
  }

  const httpStatus = health.checks.database ? 200 : 503;

  return NextResponse.json(health, { status: httpStatus });
}
