import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { extractDeviceInfo } from '@/lib/auth/session-tracking';

export async function GET(): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const sessions = await prisma.userSession.findMany({
      where: {
        userId: dbUser.id,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    logError(error as Error, 'GET /api/user/sessions');
    return NextResponse.json({ error: 'Failed to fetch session information' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (sessionId === null || sessionId === '') {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get current request device info
    const currentDeviceInfo = extractDeviceInfo(request);

    // Find the session to be terminated
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId: dbUser.id,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if this is the current session (same device/IP)
    const isCurrentSession = 
      session.ipAddress === currentDeviceInfo.ipAddress &&
      session.userAgent === currentDeviceInfo.userAgent;

    // Invalidate the session in database
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { 
        isActive: false
      },
    });

    // If terminating current session, we need to tell the client to sign out
    if (isCurrentSession) {
      return NextResponse.json({ 
        message: 'Session ended successfully',
        shouldSignOut: true 
      });
    }

    return NextResponse.json({ message: 'Session ended successfully' });
  } catch (error) {
    logError(error as Error, 'DELETE /api/user/sessions');
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}
