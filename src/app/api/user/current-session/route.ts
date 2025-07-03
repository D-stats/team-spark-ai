import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { extractDeviceInfo } from '@/lib/auth/session-tracking';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const deviceInfo = extractDeviceInfo(request);

    // Find the current session based on device info
    const currentSession = await prisma.userSession.findFirst({
      where: {
        userId: dbUser.id,
        isActive: true,
        expiresAt: { gt: new Date() },
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ 
      currentSessionId: currentSession?.id || null 
    });
  } catch (error) {
    logError(error as Error, 'GET /api/user/current-session');
    return NextResponse.json({ error: 'Failed to get current session' }, { status: 500 });
  }
}