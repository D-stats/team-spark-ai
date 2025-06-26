import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者またはマネージャーのみサーベイ作成可能
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'サーベイ作成権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, isActive, endDate } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'サーベイタイトルは必須です' }, { status: 400 });
    }

    // 期限が過去の日付でないかチェック
    if (endDate) {
      const endDateTime = new Date(endDate);
      if (endDateTime < new Date()) {
        return NextResponse.json(
          { error: '期限は現在時刻より後の日時を設定してください' },
          { status: 400 },
        );
      }
    }

    // サーベイを作成
    const survey = await prisma.survey.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        questions: [],
        isActive: Boolean(isActive),
        startDate: new Date(),
        endDate: endDate ? new Date(endDate) : null,
        organizationId: dbUser.organizationId,
      },
      include: {
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: 'サーベイの作成に失敗しました' }, { status: 500 });
  }
}
