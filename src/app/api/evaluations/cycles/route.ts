import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { createEvaluationCycle, generateEvaluations } from '@/services/evaluation.service';
import { EvaluationCycleType } from '@prisma/client';
import { logError } from '@/lib/logger';

// Get evaluation cycles list
export async function GET(_request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const cycles = await prisma.evaluationCycle.findMany({
      where: {
        organizationId: dbUser.organizationId,
      },
      include: {
        phases: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            evaluations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(cycles);
  } catch (error) {
    logError(error as Error, 'GET /api/evaluations/cycles');
    return NextResponse.json({ error: '評価サイクルの取得に失敗しました' }, { status: 500 });
  }
}

// 評価サイクル作成
export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者またはマネージャーのみ作成可能
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      return NextResponse.json({ error: '評価サイクルの作成権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, startDate, endDate, autoGenerate } = body;

    // バリデーション
    if (!name || !type || !startDate || !endDate) {
      return NextResponse.json({ error: '必要な項目が入力されていません' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: '終了日は開始日より後に設定してください' },
        { status: 400 },
      );
    }

    // 重複チェック
    const existingCycle = await prisma.evaluationCycle.findFirst({
      where: {
        organizationId: dbUser.organizationId,
        OR: [
          {
            AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
          },
        ],
        status: { in: ['DRAFT', 'ACTIVE'] },
      },
    });

    if (existingCycle) {
      return NextResponse.json(
        { error: '期間が重複する評価サイクルが存在します' },
        { status: 400 },
      );
    }

    // 評価サイクル作成
    const cycle = await createEvaluationCycle({
      organizationId: dbUser.organizationId,
      name,
      type: type as EvaluationCycleType,
      startDate: start,
      endDate: end,
    });

    // 自動生成が有効な場合、評価を生成
    if (autoGenerate) {
      const evaluationCount = await generateEvaluations(cycle.id, dbUser.organizationId);

      return NextResponse.json(
        {
          ...cycle,
          generatedEvaluations: evaluationCount,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    logError(error as Error, 'POST /api/evaluations/cycles');
    return NextResponse.json({ error: '評価サイクルの作成に失敗しました' }, { status: 500 });
  }
}
