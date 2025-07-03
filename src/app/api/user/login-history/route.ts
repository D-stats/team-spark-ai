import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId: dbUser.id },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceInfo: true,
        success: true,
        failReason: true,
        loginAt: true,
      },
      orderBy: { loginAt: 'desc' },
      take: Math.min(limit, 100), // 最大100件まで
      skip: offset,
    });

    const total = await prisma.loginHistory.count({
      where: { userId: dbUser.id },
    });

    return NextResponse.json({
      history: loginHistory,
      total,
      limit,
      offset,
    });
  } catch (error) {
    logError(error as Error, 'GET /api/user/login-history');
    return NextResponse.json({ error: 'Failed to fetch login history' }, { status: 500 });
  }
}
