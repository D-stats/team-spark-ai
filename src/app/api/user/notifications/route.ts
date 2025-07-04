import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const NotificationUpdateSchema = z.object({
  emailNotifications: z.boolean(),
  kudosNotifications: z.boolean(),
  checkinReminders: z.boolean(),
  surveyNotifications: z.boolean(),
  teamUpdates: z.boolean(),
  digestFrequency: z.enum(['NEVER', 'DAILY', 'WEEKLY', 'MONTHLY']),
});

export async function GET(): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const user = await prisma.user.findUnique({
      where: { id: dbUser.id },
      select: {
        emailNotifications: true,
        kudosNotifications: true,
        checkinReminders: true,
        surveyNotifications: true,
        teamUpdates: true,
        digestFrequency: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logError(error as Error, 'GET /api/user/notifications');
    return NextResponse.json({ error: '通知設定の取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const body = (await request.json()) as unknown;
    const validationResult = NotificationUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data = validationResult.data;

    // 通知設定を更新
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        emailNotifications: data.emailNotifications,
        kudosNotifications: data.kudosNotifications,
        checkinReminders: data.checkinReminders,
        surveyNotifications: data.surveyNotifications,
        teamUpdates: data.teamUpdates,
        digestFrequency: data.digestFrequency,
      },
      select: {
        emailNotifications: true,
        kudosNotifications: true,
        checkinReminders: true,
        surveyNotifications: true,
        teamUpdates: true,
        digestFrequency: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logError(error as Error, 'PUT /api/user/notifications');
    return NextResponse.json({ error: '通知設定の更新に失敗しました' }, { status: 500 });
  }
}
