import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const VerifyTwoFactorSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().length(6, 'Token must be 6 digits'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as unknown;
    const validationResult = VerifyTwoFactorSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email, token } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    if (!user.twoFactorEnabled || user.twoFactorSecret == null) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled for this user' },
        { status: 400 },
      );
    }

    // Verify the token against the stored secret
    const isValidToken = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication verified successfully',
      userId: user.id,
    });
  } catch (error) {
    logError(error as Error, 'POST /api/user/2fa/verify');
    return NextResponse.json(
      { error: 'Failed to verify two-factor authentication' },
      { status: 500 },
    );
  }
}
