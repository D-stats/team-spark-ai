import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const CheckTwoFactorSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as unknown;
    const validationResult = CheckTwoFactorSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email } = validationResult.data;

    // Find user by email and check 2FA status
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        twoFactorEnabled: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ twoFactorEnabled: false });
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled ?? false,
    });
  } catch (error) {
    logError(error as Error, 'POST /api/user/2fa/check');
    return NextResponse.json(
      { error: 'Failed to check two-factor authentication status' },
      { status: 500 },
    );
  }
}
