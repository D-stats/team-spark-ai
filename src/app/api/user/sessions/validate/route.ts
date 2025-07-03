import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { extractDeviceInfo } from '@/lib/auth/session-tracking';
import { logError } from '@/lib/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const deviceInfo = extractDeviceInfo(request);

    // Check if there's an active database session for this user/device combination
    const activeSession = await prisma.userSession.findFirst({
      where: {
        userId: dbUser.id,
        isActive: true,
        expiresAt: { gt: new Date() },
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      },
    });

    if (!activeSession) {
      // Try to find any active session for this user (maybe IP/UA detection is slightly off)
      const anyActiveSession = await prisma.userSession.findFirst({
        where: {
          userId: dbUser.id,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastUsedAt: 'desc' },
      });

      if (!anyActiveSession) {
        // No active session found, session was terminated
        return NextResponse.json({ valid: false, reason: 'no_active_session' }, { status: 401 });
      }

      // If there's an active session but device info doesn't match exactly,
      // create a new session for this device (this handles slight UA variations)
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const newSession = await prisma.userSession.create({
        data: {
          userId: dbUser.id,
          sessionToken,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          deviceInfo: deviceInfo.deviceInfo,
          expiresAt,
          lastUsedAt: new Date(),
        },
      });

      return NextResponse.json({ valid: true, sessionId: newSession.id });
    }

    // Update the session's last used time
    await prisma.userSession.update({
      where: { id: activeSession.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({ valid: true, sessionId: activeSession.id });
  } catch (error) {
    // If auth fails, it means the JWT is invalid, which is handled by requireAuthWithOrganization
    logError(error as Error, 'Session validation API');
    return NextResponse.json({ error: 'Session validation failed' }, { status: 401 });
  }
}