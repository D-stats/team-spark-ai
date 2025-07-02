import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { validatePassword } from '@/lib/validation/password';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { authRateLimit } from '@/lib/rate-limit';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitResult = authRateLimit.check(request, 5);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many password change attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { dbUser } = await requireAuthWithOrganization();

    const body = await request.json() as {
      currentPassword?: string;
      newPassword?: string;
    };

    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.errors[0] }, { status: 400 });
    }

    // Check if user has a password (for users who signed up via OAuth)
    if (!dbUser.password) {
      return NextResponse.json({ error: 'Password not set for this account' }, { status: 400 });
    }

    // Verify current password
    const isValidCurrentPassword = await verifyPassword(currentPassword, dbUser.password);
    if (!isValidCurrentPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    // Log successful password change
    await prisma.loginHistory.create({
      data: {
        userId: dbUser.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        device: request.headers.get('user-agent') || 'unknown',
        success: true,
        method: 'password_change',
      },
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logError(error as Error, 'PUT /api/user/password');
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}