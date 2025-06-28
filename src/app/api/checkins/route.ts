import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: dbUser.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            frequency: true,
            questions: true,
          },
        },
      },
    });

    return NextResponse.json(checkIns);
  } catch (error) {
    logError(error as Error, 'GET /api/checkins');
    return NextResponse.json({ error: 'チェックインの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const body = (await request.json()) as {
      templateId?: string;
      answers?: unknown;
      moodRating?: number | null;
    };
    const { templateId, answers, moodRating } = body;

    // バリデーション
    if (templateId === undefined) {
      return NextResponse.json({ error: 'テンプレートIDが必要です' }, { status: 400 });
    }

    if (answers === undefined || typeof answers !== 'object' || answers === null) {
      return NextResponse.json({ error: '回答が正しい形式ではありません' }, { status: 400 });
    }

    // テンプレートの存在確認
    const template = await prisma.checkInTemplate.findFirst({
      where: {
        id: templateId,
        organizationId: dbUser.organizationId,
        isActive: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'テンプレートが見つかりません' }, { status: 404 });
    }

    // チェックインを作成
    const checkIn = await prisma.checkIn.create({
      data: {
        userId: dbUser.id,
        templateId,
        answers,
        moodRating: moodRating ?? null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            frequency: true,
            questions: true,
          },
        },
      },
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    logError(error as Error, 'POST /api/checkins');
    return NextResponse.json({ error: 'チェックインの作成に失敗しました' }, { status: 500 });
  }
}
