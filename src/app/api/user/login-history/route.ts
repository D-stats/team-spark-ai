import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // Parse query parameters for pagination
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch login history for the user
    const history = await prisma.loginHistory.findMany({
      where: {
        userId: dbUser.id,
      },
      select: {
        id: true,
        ipAddress: true,
        device: true,
        location: true,
        success: true,
        method: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.loginHistory.count({
      where: {
        userId: dbUser.id,
      },
    });

    return NextResponse.json({
      history,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    logError(error as Error, 'GET /api/user/login-history');
    return NextResponse.json({ error: 'Failed to fetch login history' }, { status: 500 });
  }
}