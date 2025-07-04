import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const DisableTwoFactorSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // Check if 2FA is enabled
    if (!dbUser.twoFactorEnabled || dbUser.twoFactorSecret == null) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled' },
        { status: 400 },
      );
    }

    const body = (await request.json()) as unknown;
    const validationResult = DisableTwoFactorSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { token } = validationResult.data;

    // Verify the token against the stored secret
    const isValidToken = authenticator.verify({
      token,
      secret: dbUser.twoFactorSecret,
    });

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid authentication token. Please try again.' },
        { status: 400 },
      );
    }

    // Disable 2FA for the user
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been disabled successfully',
      twoFactorEnabled: updatedUser.twoFactorEnabled,
    });
  } catch (error) {
    logError(error as Error, 'POST /api/user/2fa/disable');
    return NextResponse.json(
      { error: 'Failed to disable two-factor authentication' },
      { status: 500 },
    );
  }
}
