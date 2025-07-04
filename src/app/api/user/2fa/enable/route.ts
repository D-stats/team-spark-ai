import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const EnableTwoFactorSchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  token: z.string().length(6, 'Token must be 6 digits'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // Check if 2FA is already enabled
    if (dbUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 },
      );
    }

    const body = (await request.json()) as unknown;
    const validationResult = EnableTwoFactorSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { secret, token } = validationResult.data;

    // Verify the token against the secret
    const isValidToken = authenticator.verify({
      token,
      secret,
    });

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid authentication token. Please try again.' },
        { status: 400 },
      );
    }

    // Enable 2FA for the user
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been enabled successfully',
      twoFactorEnabled: updatedUser.twoFactorEnabled,
    });
  } catch (error) {
    logError(error as Error, 'POST /api/user/2fa/enable');
    return NextResponse.json(
      { error: 'Failed to enable two-factor authentication' },
      { status: 500 },
    );
  }
}
