import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { CompetencyCategory } from '@prisma/client';
import { logError } from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

// 特定のコンピテンシー取得
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const competency = await prisma.competency.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
      include: {
        ratings: {
          include: {
            evaluation: {
              select: {
                id: true,
                type: true,
                overallRating: true,
                evaluatee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                evaluator: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            ratings: true,
          },
        },
      },
    });

    if (!competency) {
      return NextResponse.json({ error: 'コンピテンシーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(competency);
  } catch (error) {
    logError(error as Error, 'GET /api/competencies/[id]', { competencyId: params.id });
    return NextResponse.json({ error: 'コンピテンシーの取得に失敗しました' }, { status: 500 });
  }
}

// コンピテンシー更新
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者またはマネージャーのみ更新可能
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'コンピテンシーの更新権限がありません' }, { status: 403 });
    }

    const competency = await prisma.competency.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!competency) {
      return NextResponse.json({ error: 'コンピテンシーが見つかりません' }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      category?: string;
      behaviors?: string[];
      order?: number;
      isActive?: boolean;
    };
    const { name, description, category, behaviors, order, isActive } = body;

    // 名前の重複チェック（自分以外）
    if (name !== undefined && name !== competency.name) {
      const existingCompetency = await prisma.competency.findFirst({
        where: {
          organizationId: dbUser.organizationId,
          name,
          isActive: true,
          id: { not: params.id },
        },
      });

      if (existingCompetency) {
        return NextResponse.json(
          { error: 'A competency with the same name already exists' },
          { status: 400 },
        );
      }
    }

    const updateData: Partial<{
      name: string;
      description: string;
      category: CompetencyCategory;
      behaviors: string[];
      order: number;
      isActive: boolean;
    }> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category as CompetencyCategory;
    if (behaviors !== undefined) updateData.behaviors = behaviors;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCompetency = await prisma.competency.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedCompetency);
  } catch (error) {
    logError(error as Error, 'PUT /api/competencies/[id]', { competencyId: params.id });
    return NextResponse.json({ error: 'コンピテンシーの更新に失敗しました' }, { status: 500 });
  }
}

// コンピテンシー削除
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者のみ削除可能
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'コンピテンシーの削除権限がありません' }, { status: 403 });
    }

    const competency = await prisma.competency.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
      include: {
        _count: {
          select: {
            ratings: true,
          },
        },
      },
    });

    if (!competency) {
      return NextResponse.json({ error: 'コンピテンシーが見つかりません' }, { status: 404 });
    }

    // 評価データがある場合は論理削除（非アクティブ化）
    if (competency._count.ratings > 0) {
      await prisma.competency.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: '評価データがあるため、コンピテンシーを非アクティブ化しました',
      });
    }

    // 評価データがない場合は物理削除
    await prisma.competency.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'DELETE /api/competencies/[id]', { competencyId: params.id });
    return NextResponse.json({ error: 'コンピテンシーの削除に失敗しました' }, { status: 500 });
  }
}
