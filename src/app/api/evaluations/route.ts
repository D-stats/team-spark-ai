import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { canViewEvaluation } from '@/services/evaluation.service';
import { EvaluationType, EvaluationStatus } from '@prisma/client';
import { logError } from '@/lib/logger';

// Get evaluations list
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)), 100);
    const skip = (page - 1) * limit;

    const cycleId = searchParams.get('cycleId');
    const evaluateeId = searchParams.get('evaluateeId');
    const evaluatorId = searchParams.get('evaluatorId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: {
      cycleId?: string;
      cycle?: { organizationId: string };
      evaluateeId?: string;
      evaluatorId?: string;
      type?: EvaluationType;
      status?: EvaluationStatus;
    } = {};

    // Cycle filter
    if (cycleId !== null) {
      where.cycleId = cycleId;
    } else {
      // If no cycle is specified, only cycles within the organization
      where.cycle = {
        organizationId: dbUser.organizationId,
      };
    }

    // Evaluatee filter
    if (evaluateeId !== null) {
      where.evaluateeId = evaluateeId;
    }

    // Evaluator filter
    if (evaluatorId !== null) {
      where.evaluatorId = evaluatorId;
    }

    // Type filter
    if (type !== null) {
      where.type = type as EvaluationType;
    }

    // Status filter
    if (status !== null) {
      where.status = status as EvaluationStatus;
    }

    // Get total count for pagination
    const totalCount = await prisma.evaluation.count({ where });

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        cycle: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        evaluatee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        competencyRatings: {
          include: {
            competency: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // 権限チェック - 閲覧可能な評価のみフィルタリング
    const filteredEvaluations = evaluations.filter((evaluation) =>
      canViewEvaluation(dbUser, evaluation),
    );

    // Return paginated response
    return NextResponse.json({
      data: filteredEvaluations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logError(error as Error, 'GET /api/evaluations');
    return NextResponse.json({ error: '評価の取得に失敗しました' }, { status: 500 });
  }
}

// 評価作成（通常は自動生成されるが、手動追加用）
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者またはマネージャーのみ作成可能
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      return NextResponse.json({ error: '評価の作成権限がありません' }, { status: 403 });
    }

    const body = (await request.json()) as {
      cycleId?: string;
      evaluateeId?: string;
      evaluatorId?: string;
      type?: string;
    };
    const { cycleId, evaluateeId, evaluatorId, type } = body;

    // バリデーション
    if (
      cycleId === undefined ||
      evaluateeId === undefined ||
      evaluatorId === undefined ||
      type === undefined
    ) {
      return NextResponse.json({ error: '必要な項目が入力されていません' }, { status: 400 });
    }

    // サイクルの存在確認
    const cycle = await prisma.evaluationCycle.findFirst({
      where: {
        id: cycleId,
        organizationId: dbUser.organizationId,
      },
    });

    if (!cycle) {
      return NextResponse.json({ error: '評価サイクルが見つかりません' }, { status: 404 });
    }

    // 被評価者・評価者の存在確認
    const evaluatee = await prisma.user.findFirst({
      where: {
        id: evaluateeId,
        organizationId: dbUser.organizationId,
      },
    });

    const evaluator = await prisma.user.findFirst({
      where: {
        id: evaluatorId,
        organizationId: dbUser.organizationId,
      },
    });

    if (!evaluatee || !evaluator) {
      return NextResponse.json({ error: '指定されたユーザーが見つかりません' }, { status: 404 });
    }

    // 重複チェック
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: {
        cycleId_evaluateeId_evaluatorId_type: {
          cycleId,
          evaluateeId,
          evaluatorId,
          type: type as EvaluationType,
        },
      },
    });

    if (existingEvaluation) {
      return NextResponse.json({ error: '同じ評価が既に存在します' }, { status: 400 });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        cycleId,
        evaluateeId,
        evaluatorId,
        type: type as EvaluationType,
      },
      include: {
        cycle: {
          select: {
            id: true,
            name: true,
            type: true,
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

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    logError(error as Error, 'POST /api/evaluations');
    return NextResponse.json({ error: '評価の作成に失敗しました' }, { status: 500 });
  }
}
