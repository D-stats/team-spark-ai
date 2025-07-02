import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

interface NotificationSettings {
  email: {
    kudos: boolean;
    checkins: boolean;
    okr: boolean;
    surveys: boolean;
    teamUpdates: boolean;
    evaluations: boolean;
  };
  inApp: {
    kudos: boolean;
    checkins: boolean;
    okr: boolean;
    surveys: boolean;
    teamUpdates: boolean;
    evaluations: boolean;
  };
  frequency: 'instant' | 'daily' | 'weekly' | 'never';
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const body = await request.json() as NotificationSettings;
    const { email, inApp, frequency } = body;

    // Validate input structure
    if (!email || !inApp || !frequency) {
      return NextResponse.json({ error: 'Invalid notification settings format' }, { status: 400 });
    }

    // Validate frequency value
    if (!['instant', 'daily', 'weekly', 'never'].includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency value' }, { status: 400 });
    }

    // Validate email and inApp settings structure
    const requiredCategories = ['kudos', 'checkins', 'okr', 'surveys', 'teamUpdates', 'evaluations'];
    for (const category of requiredCategories) {
      if (typeof email[category as keyof typeof email] !== 'boolean' || 
          typeof inApp[category as keyof typeof inApp] !== 'boolean') {
        return NextResponse.json({ error: `Invalid ${category} setting` }, { status: 400 });
      }
    }

    // Update notification settings in database
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        notificationSettings: {
          email,
          inApp,
          frequency,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
      select: {
        id: true,
        notificationSettings: true,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updatedUser.notificationSettings,
    });
  } catch (error) {
    logError(error as Error, 'PUT /api/user/notifications');
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const user = await prisma.user.findUnique({
      where: { id: dbUser.id },
      select: {
        notificationSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: user.notificationSettings || {
        email: {
          kudos: true,
          checkins: true,
          okr: true,
          surveys: true,
          teamUpdates: true,
          evaluations: true,
        },
        inApp: {
          kudos: true,
          checkins: true,
          okr: true,
          surveys: true,
          teamUpdates: true,
          evaluations: true,
        },
        frequency: 'instant',
      },
    });
  } catch (error) {
    logError(error as Error, 'GET /api/user/notifications');
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
  }
}
