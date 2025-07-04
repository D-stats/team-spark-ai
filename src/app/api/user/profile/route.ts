import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const ProfileUpdateSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください').optional(),
  skills: z.array(z.string()).max(20, 'スキルは20個まで登録できます').optional(),
  timezone: z.string().optional(),
  locale: z.enum(['en', 'ja']).optional(),
  phoneNumber: z.string().max(20, '電話番号は20文字以内で入力してください').optional(),
  linkedinUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  githubUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
});

export async function GET(): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const user = await prisma.user.findUnique({
      where: { id: dbUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        timezone: true,
        locale: true,
        phoneNumber: true,
        linkedinUrl: true,
        githubUrl: true,
        twitterUrl: true,
        twoFactorEnabled: true,
        lastPasswordChange: true,
        emailNotifications: true,
        kudosNotifications: true,
        checkinReminders: true,
        surveyNotifications: true,
        teamUpdates: true,
        digestFrequency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logError(error as Error, 'GET /api/user/profile');
    return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const body = (await request.json()) as unknown;
    const validationResult = ProfileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data = validationResult.data;

    // Convert empty strings to null for optional URL fields
    const updateData = {
      ...data,
      linkedinUrl: data.linkedinUrl === '' ? null : data.linkedinUrl,
      githubUrl: data.githubUrl === '' ? null : data.githubUrl,
      twitterUrl: data.twitterUrl === '' ? null : data.twitterUrl,
      bio: data.bio === '' ? null : data.bio,
      phoneNumber: data.phoneNumber === '' ? null : data.phoneNumber,
      skills: data.skills?.filter((skill) => skill.trim() !== '') || [],
    };

    // ユーザープロフィールを更新
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        timezone: true,
        locale: true,
        phoneNumber: true,
        linkedinUrl: true,
        githubUrl: true,
        twitterUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logError(error as Error, 'PUT /api/user/profile');
    return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
  }
}
