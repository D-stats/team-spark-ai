import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { canEditEvaluation } from '@/services/evaluation.service';
import {
  createErrorResponse,
  createSuccessResponse,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '@/lib/errors';
import { SubmitEvaluationSchema } from '@/types/api';

interface RouteParams {
  params: {
    id: string;
  };
}

// 評価送信
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: {
        cycle: {
          select: {
            organizationId: true,
            status: true,
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

    // 評価サイクルがアクティブかチェック
    if (evaluation.cycle.status !== 'ACTIVE') {
      throw new ConflictError('アクティブでない評価サイクルの評価は送信できません');
    }

    // すでに送信済みかチェック
    if (evaluation.status !== 'DRAFT') {
      throw new ConflictError('この評価は既に送信済みです');
    }

    const body = (await request.json()) as unknown;
    const validatedData = SubmitEvaluationSchema.parse(body);

    // トランザクションで評価とコンピテンシー評価を更新・送信
    const submittedEvaluation = await prisma.$transaction(async (tx) => {
      // 評価の更新と送信
      const updated = await tx.evaluation.update({
        where: { id: params.id },
        data: {
          overallRating: validatedData.overallRating,
          overallComments: validatedData.overallComments,
          strengths: validatedData.strengths,
          improvements: validatedData.improvements,
          careerGoals: validatedData.careerGoals,
          developmentPlan: validatedData.developmentPlan,
          status: 'SUBMITTED',
          submittedAt: new Date(),
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

    // TODO: 送信通知メールの送信
    // await notificationService.sendEvaluationSubmitted(submittedEvaluation);

    return NextResponse.json(createSuccessResponse(submittedEvaluation));
  } catch (error) {
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
