import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { extractDeviceInfo, createUserSession } from '@/lib/auth/session-tracking';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const body = (await request.json()) as { action: unknown };
    const { action } = body;

    const deviceInfo = extractDeviceInfo(request);

    if (action === 'create') {
      // Check if we already have an active session for this device/IP combination
      const existingSession = await prisma.userSession.findFirst({
        where: {
          userId: dbUser.id,
          isActive: true,
          expiresAt: { gt: new Date() },
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
        },
      });

      if (!existingSession) {
        // Create a new session record
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await createUserSession(dbUser.id, sessionToken, deviceInfo, expiresAt);
      } else {
        // Update existing session
        await prisma.userSession.update({
          where: { id: existingSession.id },
          data: { lastUsedAt: new Date() },
        });
      }
    } else if (action === 'update') {
      // Update last used time for all active sessions from this device
      await prisma.userSession.updateMany({
        where: {
          userId: dbUser.id,
          isActive: true,
          expiresAt: { gt: new Date() },
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
        },
        data: {
          lastUsedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'Session tracking API');
    return NextResponse.json({ error: 'Failed to track session' }, { status: 500 });
  }
}
