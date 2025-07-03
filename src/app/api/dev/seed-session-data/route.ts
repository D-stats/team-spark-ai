import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

// This endpoint is only for development/testing purposes
export async function POST(_request: NextRequest): Promise<NextResponse> {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { dbUser } = await requireAuthWithOrganization();

    // Create some sample sessions
    const now = new Date();
    const sessions = [
      {
        userId: dbUser.id,
        sessionToken: `dev_session_1_${Date.now()}`,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        isActive: true,
        lastUsedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        userId: dbUser.id,
        sessionToken: `dev_session_2_${Date.now()}`,
        deviceInfo: 'Safari on iOS',
        ipAddress: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        isActive: true,
        lastUsedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        userId: dbUser.id,
        sessionToken: `dev_session_3_${Date.now()}`,
        deviceInfo: 'Firefox on macOS',
        ipAddress: '172.16.10.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0',
        isActive: true,
        lastUsedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    ];

    // Create some sample login history
    const loginHistory = [
      {
        userId: dbUser.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceInfo: 'Chrome on Windows',
        success: true,
        loginAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
      },
      {
        userId: dbUser.id,
        ipAddress: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15',
        deviceInfo: 'Safari on iOS',
        success: true,
        loginAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        userId: dbUser.id,
        ipAddress: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceInfo: 'Chrome on Windows',
        success: false,
        failReason: 'Invalid credentials',
        loginAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
      },
      {
        userId: dbUser.id,
        ipAddress: '172.16.10.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0',
        deviceInfo: 'Firefox on macOS',
        success: true,
        loginAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      },
      {
        userId: dbUser.id,
        ipAddress: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15',
        deviceInfo: 'Safari on iOS',
        success: true,
        loginAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    ];

    // Insert the test data
    await prisma.userSession.createMany({
      data: sessions,
      skipDuplicates: true,
    });

    await prisma.loginHistory.createMany({
      data: loginHistory,
      skipDuplicates: true,
    });

    return NextResponse.json({ 
      message: 'Test data created successfully',
      sessionsCreated: sessions.length,
      loginHistoryCreated: loginHistory.length,
    });
  } catch (error) {
    logError(error as Error, 'Seed session data');
    return NextResponse.json({ error: 'Failed to create test data' }, { status: 500 });
  }
}