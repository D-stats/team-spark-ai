import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
    newPassword: z
      .string()
      .min(8, 'パスワードは8文字以上である必要があります')
      .max(128, 'パスワードは128文字以内で入力してください')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'パスワードは大文字、小文字、数字を含む必要があります',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const body = (await request.json()) as unknown;
    const validationResult = PasswordChangeSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { currentPassword, newPassword } = validationResult.data;

    // パスワードが設定されていない場合（ソーシャルログインのみのユーザー）
    if (dbUser.password === null || dbUser.password === '') {
      return NextResponse.json(
        { error: 'パスワードが設定されていません。初回のパスワード設定には別の手順が必要です。' },
        { status: 400 },
      );
    }

    // 現在のパスワードを確認
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 });
    }

    // 新しいパスワードをハッシュ化
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // パスワードを更新
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        password: hashedNewPassword,
        lastPasswordChange: new Date(),
      },
    });

    return NextResponse.json({ message: 'パスワードが正常に更新されました' });
  } catch (error) {
    logError(error as Error, 'PUT /api/user/password');
    return NextResponse.json({ error: 'パスワードの更新に失敗しました' }, { status: 500 });
  }
}
