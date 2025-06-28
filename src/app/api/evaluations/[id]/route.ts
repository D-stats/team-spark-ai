import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { canViewEvaluation, canEditEvaluation } from '@/services/evaluation.service';
import {
  createErrorResponse,
  createSuccessResponse,
  NotFoundError,
  AuthorizationError,
} from '@/lib/errors';
import { logError } from '@/lib/logger';
import { SaveEvaluationSchema } from '@/types/api';

interface RouteParams {
  params: {
    id: string;
  };
}

// 特定の評価取得
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: {
        cycle: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            organizationId: true,
          },
        },
        evaluatee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        competencyRatings: {
          include: {
            competency: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                behaviors: true,
                order: true,
                isActive: true,
                organizationId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundError('評価', params.id);
    }

    // 組織確認
    if (evaluation.cycle.organizationId !== dbUser.organizationId) {
      throw new NotFoundError('評価', params.id);
    }

    // 権限チェック
    if (!canViewEvaluation(dbUser, evaluation)) {
      throw new AuthorizationError('閲覧', '評価');
    }

    return NextResponse.json(createSuccessResponse(evaluation));
  } catch (error) {
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// 評価下書き保存 (PATCH)
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: {
        cycle: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundError('評価', params.id);
    }

    // 組織確認
    if (evaluation.cycle.organizationId !== dbUser.organizationId) {
      throw new NotFoundError('評価', params.id);
    }

    // 権限チェック
    if (!canEditEvaluation(dbUser, evaluation)) {
      throw new AuthorizationError('編集', '評価');
    }

    const body = (await request.json()) as unknown;
    const validatedData = SaveEvaluationSchema.parse(body);

    // トランザクションで評価とコンピテンシー評価を更新
    const updatedEvaluation = await prisma.$transaction(async (tx) => {
      // 評価の更新
      const updated = await tx.evaluation.update({
        where: { id: params.id },
        data: {
          overallRating: validatedData.overallRating,
          overallComments: validatedData.overallComments,
          strengths: validatedData.strengths,
          improvements: validatedData.improvements,
          careerGoals: validatedData.careerGoals,
          developmentPlan: validatedData.developmentPlan,
        },
      });

      // コンピテンシー評価の更新
      if (
        validatedData.competencyRatings !== undefined &&
        validatedData.competencyRatings.length > 0
      ) {
        // 既存のコンピテンシー評価を削除
        await tx.competencyRating.deleteMany({
          where: { evaluationId: params.id },
        });

        // 新しいコンピテンシー評価を作成
        await tx.competencyRating.createMany({
          data: validatedData.competencyRatings.map((rating) => ({
            evaluationId: params.id,
            competencyId: rating.competencyId,
            rating: rating.rating,
            comments: rating.comments,
            behaviors: rating.behaviors,
            examples: rating.examples,
            improvementAreas: rating.improvementAreas,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json(createSuccessResponse(updatedEvaluation));
  } catch (error) {
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// 評価削除
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者のみ削除可能
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: '評価の削除権限がありません' }, { status: 403 });
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: {
        cycle: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: '評価が見つかりません' }, { status: 404 });
    }

    // 組織確認
    if (evaluation.cycle.organizationId !== dbUser.organizationId) {
      return NextResponse.json({ error: '評価が見つかりません' }, { status: 404 });
    }

    // 提出済みの評価は削除不可
    if (evaluation.status !== 'DRAFT') {
      return NextResponse.json({ error: '提出済みの評価は削除できません' }, { status: 400 });
    }

    await prisma.evaluation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'DELETE /api/evaluations/[id]', { evaluationId: params.id });
    return NextResponse.json({ error: '評価の削除に失敗しました' }, { status: 500 });
  }
}
