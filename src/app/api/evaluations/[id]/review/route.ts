/**
 * 評価承認・レビューAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { 
  ErrorHandler, 
  createErrorResponse, 
  createSuccessResponse, 
  NotFoundError, 
  AuthorizationError,
  ConflictError,
  ValidationError 
} from '@/lib/errors';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

const ReviewEvaluationSchema = z.object({
  approved: z.boolean(),
  comments: z.string().optional(),
  managerComments: z.string().optional(),
});

// 評価承認・却下
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        evaluatee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // 権限チェック（管理者またはマネージャーのみ）
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      throw new AuthorizationError('レビュー', '評価');
    }

    // 提出済み評価のみレビュー可能
    if (evaluation.status !== 'SUBMITTED') {
      throw new ConflictError('提出済みの評価のみレビューできます');
    }

    const body = await request.json();
    const validatedData = ReviewEvaluationSchema.parse(body);

    // レビュー実行
    const reviewedEvaluation = await prisma.evaluation.update({
      where: { id: params.id },
      data: {
        status: validatedData.approved ? 'REVIEWED' : 'DRAFT',
        reviewedAt: validatedData.approved ? new Date() : null,
        reviewedBy: validatedData.approved ? dbUser.id : null,
        managerComments: validatedData.managerComments,
      },
    });

    // TODO: レビュー完了通知メールの送信
    // if (validatedData.approved) {
    //   await notificationService.sendEvaluationApproved(reviewedEvaluation);
    // } else {
    //   await notificationService.sendEvaluationRejected(reviewedEvaluation, validatedData.comments);
    // }

    return NextResponse.json(createSuccessResponse(reviewedEvaluation));
  } catch (error) {
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// 評価共有（従業員に結果を公開）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // 権限チェック（管理者またはマネージャーのみ）
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      throw new AuthorizationError('共有', '評価');
    }

    // レビュー済み評価のみ共有可能
    if (evaluation.status !== 'REVIEWED') {
      throw new ConflictError('レビュー済みの評価のみ共有できます');
    }

    // 評価を共有状態に更新
    const sharedEvaluation = await prisma.evaluation.update({
      where: { id: params.id },
      data: {
        status: 'SHARED',
        sharedAt: new Date(),
        isVisible: true,
      },
    });

    // TODO: 評価結果共有通知メールの送信
    // await notificationService.sendEvaluationShared(sharedEvaluation);

    return NextResponse.json(createSuccessResponse(sharedEvaluation));
  } catch (error) {
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}