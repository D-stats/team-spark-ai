import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(1, '組織名は必須です').max(100, '組織名は100文字以内で入力してください'),
  slug: z.string()
    .min(1, '組織IDは必須です')
    .max(50, '組織IDは50文字以内で入力してください')
    .regex(/^[a-z0-9-]+$/, '組織IDは小文字、数字、ハイフンのみ使用可能です'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createOrgSchema.parse(body);

    // 既存の組織に所属しているかチェック
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { organization: true },
    });

    if (existingUser?.organization) {
      return NextResponse.json(
        { error: '既に組織に所属しています' },
        { status: 400 }
      );
    }

    // 組織スラッグの重複チェック
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'この組織IDは既に使用されています' },
        { status: 400 }
      );
    }

    // トランザクションで組織とユーザーを作成
    const result = await prisma.$transaction(async (tx) => {
      // 組織を作成
      const organization = await tx.organization.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          settings: {},
        },
      });

      // ユーザーを作成または更新
      const userData = {
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        organizationId: organization.id,
        role: 'ADMIN' as const,
      };

      const createdUser = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: userData,
          })
        : await tx.user.create({
            data: userData,
          });

      return { organization, user: createdUser };
    });

    return NextResponse.json({
      organization: result.organization,
      user: result.user,
    });
  } catch (error) {
    console.error('Organization creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '組織の作成に失敗しました' },
      { status: 500 }
    );
  }
}