import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const token = await getToken({ req: request });
    const currentSessionId = token?.['jti'] || 'unknown';

    // Fetch active sessions for the user
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: dbUser.id,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        sessionId: true,
        device: true,
        ipAddress: true,
        location: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });

    // Mark current session
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionId === currentSessionId,
    }));

    return NextResponse.json({
      sessions: sessionsWithCurrent,
    });
  } catch (error) {
    logError(error as Error, 'GET /api/user/sessions');
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const body = await request.json() as { sessionId?: string };
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify the session belongs to the user
    const session = await prisma.userSession.findFirst({
      where: {
        userId: dbUser.id,
        sessionId,
        isActive: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Deactivate the session
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        isActive: false,
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    logError(error as Error, 'DELETE /api/user/sessions');
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}