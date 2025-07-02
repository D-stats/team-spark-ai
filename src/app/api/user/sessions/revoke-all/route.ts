import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const token = await getToken({ req: request });
    const currentSessionId = token?.['jti'] || 'unknown';

    // Deactivate all sessions except the current one
    await prisma.userSession.updateMany({
      where: {
        userId: dbUser.id,
        isActive: true,
        sessionId: {
          not: currentSessionId,
        },
      },
      data: {
        isActive: false,
        lastUsedAt: new Date(),
      },
    });

    // Log the session revocation
    await prisma.loginHistory.create({
      data: {
        userId: dbUser.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        device: request.headers.get('user-agent') || 'unknown',
        success: true,
        method: 'revoke_all_sessions',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All other sessions revoked successfully',
    });
  } catch (error) {
    logError(error as Error, 'POST /api/user/sessions/revoke-all');
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }
}