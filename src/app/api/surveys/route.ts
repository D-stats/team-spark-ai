import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者またはマネージャーのみサーベイ作成可能
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'サーベイ作成権限がありません' }, { status: 403 });
    }

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      isActive?: unknown;
      endDate?: unknown;
    };
    const { title, description, isActive, endDate } = body;

    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'サーベイタイトルは必須です' }, { status: 400 });
    }

    // 期限が過去の日付でないかチェック
    if (endDate !== undefined && endDate !== null) {
      const endDateTime = new Date(endDate as string);
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
        description: typeof description === 'string' ? description.trim() : null,
        questions: [],
        isActive: Boolean(isActive),
        startDate: new Date(),
        endDate: endDate !== undefined && endDate !== null ? new Date(endDate as string) : null,
        organizationId: dbUser.organizationId as string,
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
    logError(error as Error, 'POST /api/surveys');
    return NextResponse.json({ error: 'サーベイの作成に失敗しました' }, { status: 500 });
  }
}
