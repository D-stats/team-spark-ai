import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { logError } from '@/lib/logger';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // Check if 2FA is already enabled
    if (dbUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 },
      );
    }

    // Generate a new secret
    const secret = authenticator.generateSecret();

    // Create the service name for the authenticator app
    const serviceName = 'TeamSpark AI';
    const accountName = dbUser.email;

    // Generate the otpauth URL
    const otpauthUrl = authenticator.keyuri(accountName, serviceName, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return NextResponse.json({
      secret,
      qrCodeDataUrl,
      manualEntryKey: secret,
      serviceName,
      accountName,
    });
  } catch (error) {
    logError(error as Error, 'POST /api/user/2fa/setup');
    return NextResponse.json(
      { error: 'Failed to setup two-factor authentication' },
      { status: 500 },
    );
  }
}
