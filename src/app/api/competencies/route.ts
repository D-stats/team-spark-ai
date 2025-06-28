import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { CompetencyCategory } from '@prisma/client';
import { logError } from '@/lib/logger';

// Get competencies list
export async function GET(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const isActive = searchParams.get('active');

    const where: {
      organizationId: string;
      category?: CompetencyCategory;
      isActive?: boolean;
    } = {
      organizationId: dbUser.organizationId,
    };

    if (category) {
      where.category = category as CompetencyCategory;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const competencies = await prisma.competency.findMany({
      where,
      include: {
        _count: {
          select: {
            ratings: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(competencies);
  } catch (error) {
    logError(error as Error, 'GET /api/competencies');
    return NextResponse.json({ error: 'コンピテンシーの取得に失敗しました' }, { status: 500 });
  }
}

// コンピテンシー作成
export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者またはマネージャーのみ作成可能
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'コンピテンシーの作成権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, behaviors, order } = body;

    // バリデーション
    if (!name || !description || !category) {
      return NextResponse.json({ error: '必要な項目が入力されていません' }, { status: 400 });
    }

    // 名前の重複チェック
    const existingCompetency = await prisma.competency.findFirst({
      where: {
        organizationId: dbUser.organizationId,
        name,
        isActive: true,
      },
    });

    if (existingCompetency) {
      return NextResponse.json(
        { error: '同じ名前のコンピテンシーが既に存在します' },
        { status: 400 },
      );
    }

    const competency = await prisma.competency.create({
      data: {
        organizationId: dbUser.organizationId,
        name,
        description,
        category: category as CompetencyCategory,
        behaviors: behaviors || [],
        order: order || 0,
      },
    });

    return NextResponse.json(competency, { status: 201 });
  } catch (error) {
    logError(error as Error, 'POST /api/competencies');
    return NextResponse.json({ error: 'コンピテンシーの作成に失敗しました' }, { status: 500 });
  }
}
