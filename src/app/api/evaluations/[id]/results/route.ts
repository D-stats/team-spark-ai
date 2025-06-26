import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { aggregateEvaluationResults } from '@/services/evaluation.service';

interface RouteParams {
  params: {
    id: string;
  };
}

// 評価結果の集計取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const { searchParams } = new URL(request.url);

    const evaluateeId = searchParams.get('evaluateeId');

    if (!evaluateeId) {
      return NextResponse.json({ error: '被評価者IDが必要です' }, { status: 400 });
    }

    // 評価サイクルの存在確認と組織チェック
    const cycle = await prisma.evaluationCycle.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!cycle) {
      return NextResponse.json({ error: '評価サイクルが見つかりません' }, { status: 404 });
    }

    // 被評価者の存在確認と組織チェック
    const evaluatee = await prisma.user.findFirst({
      where: {
        id: evaluateeId,
        organizationId: dbUser.organizationId,
      },
    });

    if (!evaluatee) {
      return NextResponse.json({ error: '被評価者が見つかりません' }, { status: 404 });
    }

    // 権限チェック（管理者、マネージャー、本人のみ）
    const canViewResults =
      dbUser.role === 'ADMIN' ||
      dbUser.id === evaluateeId ||
      (dbUser.role === 'MANAGER' && (await isManager(dbUser.id, evaluateeId)));

    if (!canViewResults) {
      return NextResponse.json({ error: '評価結果を閲覧する権限がありません' }, { status: 403 });
    }

    const results = await aggregateEvaluationResults(params.id, evaluateeId);

    // 被評価者の情報も含めて返す
    return NextResponse.json({
      ...results,
      evaluatee: {
        id: evaluatee.id,
        name: evaluatee.name,
        email: evaluatee.email,
        avatarUrl: evaluatee.avatarUrl,
      },
      cycle: {
        id: cycle.id,
        name: cycle.name,
        type: cycle.type,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching evaluation results:', error);
    return NextResponse.json({ error: '評価結果の取得に失敗しました' }, { status: 500 });
  }
}

// マネージャーかどうかをチェックするヘルパー関数
async function isManager(managerId: string, userId: string): Promise<boolean> {
  const managedTeam = await prisma.team.findFirst({
    where: {
      managerId,
      members: {
        some: { userId },
      },
    },
  });

  return !!managedTeam;
}
