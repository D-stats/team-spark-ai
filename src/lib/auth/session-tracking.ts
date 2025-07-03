import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

interface DeviceInfo {
  userAgent: string | null;
  ipAddress: string | null;
  deviceInfo: string | null;
}

/**
 * Extract device information from request
 */
export function extractDeviceInfo(request: NextRequest): DeviceInfo {
  const userAgent = request.headers.get('user-agent');
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    request.ip ??
    'unknown';

  // Parse user agent to get device info
  let deviceInfo = null;
  if (userAgent !== null && userAgent !== undefined && userAgent !== '') {
    const agent = userAgent.toLowerCase();

    // Browser detection
    let browser = 'Unknown Browser';
    if (agent.includes('chrome')) browser = 'Chrome';
    else if (agent.includes('firefox')) browser = 'Firefox';
    else if (agent.includes('safari') && !agent.includes('chrome')) browser = 'Safari';
    else if (agent.includes('edge')) browser = 'Edge';
    else if (agent.includes('opera')) browser = 'Opera';

    // OS detection
    let os = '';
    if (agent.includes('windows')) os = 'Windows';
    else if (agent.includes('mac')) os = 'macOS';
    else if (agent.includes('linux')) os = 'Linux';
    else if (agent.includes('android')) os = 'Android';
    else if (agent.includes('ios') || agent.includes('iphone') || agent.includes('ipad'))
      os = 'iOS';

    deviceInfo = os ? `${browser} on ${os}` : browser;
  }

  return {
    userAgent,
    ipAddress,
    deviceInfo,
  };
}

/**
 * Create a new user session record
 */
export async function createUserSession(
  userId: string,
  sessionToken: string,
  deviceInfo: DeviceInfo,
  expiresAt: Date,
): Promise<void> {
  try {
    await prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        deviceInfo: deviceInfo.deviceInfo,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  } catch (error) {
    logError(error as Error, 'createUserSession');
  }
}

/**
 * Update session last used time
 */
export async function updateSessionLastUsed(sessionToken: string): Promise<void> {
  try {
    await prisma.userSession.updateMany({
      where: {
        sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
  } catch (error) {
    logError(error as Error, 'updateSessionLastUsed');
  }
}

/**
 * Record login attempt in history
 */
export async function recordLoginAttempt(
  userId: string,
  deviceInfo: DeviceInfo,
  success: boolean,
  failReason?: string,
): Promise<void> {
  try {
    await prisma.loginHistory.create({
      data: {
        userId,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        deviceInfo: deviceInfo.deviceInfo,
        success,
        failReason,
        loginAt: new Date(),
      },
    });
  } catch (error) {
    logError(error as Error, 'recordLoginAttempt');
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await prisma.userSession.updateMany({
      where: {
        expiresAt: { lte: new Date() },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  } catch (error) {
    logError(error as Error, 'cleanupExpiredSessions');
  }
}
