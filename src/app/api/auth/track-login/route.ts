import { NextRequest, NextResponse } from 'next/server';
import { recordLoginAttempt, extractDeviceInfo } from '@/lib/auth/session-tracking';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, success, failReason } = body;

    if (typeof email !== 'string' || typeof success !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const deviceInfo = extractDeviceInfo(request);

    // Find user by email to get userId
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      await recordLoginAttempt(user.id, deviceInfo, success, failReason);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'Login tracking API');
    return NextResponse.json({ error: 'Failed to track login' }, { status: 500 });
  }
}