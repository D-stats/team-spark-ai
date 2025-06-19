import { prisma } from '@/lib/prisma';
import {
  EvaluationCycleType,
  CycleStatus,
  EvaluationPhaseType,
  EvaluationType,
  EvaluationStatus,
  CompetencyCategory,
  Role,
} from '@prisma/client';

// 評価サイクル作成
export async function createEvaluationCycle(data: {
  organizationId: string;
  name: string;
  type: EvaluationCycleType;
  startDate: Date;
  endDate: Date;
}) {
  // デフォルトのフェーズ設定
  const defaultPhases = getDefaultPhases(data.type, data.startDate, data.endDate);

  return prisma.evaluationCycle.create({
    data: {
      ...data,
      phases: {
        create: defaultPhases,
      },
    },
    include: {
      phases: {
        orderBy: { order: 'asc' },
      },
    },
  });
}

// デフォルトフェーズの生成
function getDefaultPhases(type: EvaluationCycleType, startDate: Date, endDate: Date) {
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const phases = [
    {
      type: EvaluationPhaseType.SELF,
      name: '自己評価',
      description: '自己の成果と成長を振り返る',
      order: 1,
      durationRatio: 0.3,
    },
    {
      type: EvaluationPhaseType.PEER,
      name: 'ピア評価',
      description: '同僚からのフィードバック',
      order: 2,
      durationRatio: 0.3,
    },
    {
      type: EvaluationPhaseType.MANAGER,
      name: '上司評価',
      description: '上司による評価とフィードバック',
      order: 3,
      durationRatio: 0.3,
    },
    {
      type: EvaluationPhaseType.CALIBRATION,
      name: 'キャリブレーション',
      description: '評価の調整と最終化',
      order: 4,
      durationRatio: 0.1,
    },
  ];

  let currentDate = new Date(startDate);
  
  return phases.map((phase) => {
    const phaseDays = Math.floor(totalDays * phase.durationRatio);
    const phaseStartDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + phaseDays);
    const phaseEndDate = new Date(currentDate);

    return {
      type: phase.type,
      name: phase.name,
      description: phase.description,
      order: phase.order,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
    };
  });
}

// 評価対象者の自動生成
export async function generateEvaluations(cycleId: string, organizationId: string) {
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    include: { phases: true },
  });

  if (!cycle || cycle.organizationId !== organizationId) {
    throw new Error('評価サイクルが見つかりません');
  }

  // 組織内の全アクティブユーザーを取得
  const users = await prisma.user.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      teamMemberships: {
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const evaluations = [];

  for (const user of users) {
    // 自己評価
    evaluations.push({
      cycleId,
      evaluateeId: user.id,
      evaluatorId: user.id,
      type: EvaluationType.SELF,
    });

    // 上司評価（チームマネージャーから）
    const managedTeams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
        managerId: { not: null },
      },
    });

    for (const team of managedTeams) {
      if (team.managerId && team.managerId !== user.id) {
        evaluations.push({
          cycleId,
          evaluateeId: user.id,
          evaluatorId: team.managerId,
          type: EvaluationType.MANAGER,
        });
      }
    }

    // ピア評価（同じチームメンバーから最大3人）
    const teamMembers = new Set<string>();
    for (const membership of user.teamMemberships) {
      for (const member of membership.team.members) {
        if (member.userId !== user.id) {
          teamMembers.add(member.userId);
        }
      }
    }

    const peerEvaluators = Array.from(teamMembers).slice(0, 3);
    for (const evaluatorId of peerEvaluators) {
      evaluations.push({
        cycleId,
        evaluateeId: user.id,
        evaluatorId,
        type: EvaluationType.PEER,
      });
    }
  }

  // 重複を除去してデータベースに保存
  const uniqueEvaluations = evaluations.filter((evaluation, index, self) =>
    index === self.findIndex((e) =>
      e.evaluateeId === evaluation.evaluateeId &&
      e.evaluatorId === evaluation.evaluatorId &&
      e.type === evaluation.type
    )
  );

  await prisma.evaluation.createMany({
    data: uniqueEvaluations,
    skipDuplicates: true,
  });

  return uniqueEvaluations.length;
}

// 評価の権限チェック
export function canViewEvaluation(
  viewer: { id: string; role: Role },
  evaluation: {
    evaluateeId: string;
    evaluatorId: string;
    type: EvaluationType;
    status: EvaluationStatus;
    isVisible: boolean;
  }
): boolean {
  // 管理者は全て閲覧可能
  if (viewer.role === 'ADMIN') return true;

  // 自分が被評価者の場合
  if (viewer.id === evaluation.evaluateeId) {
    // 公開されている評価のみ
    return evaluation.isVisible || evaluation.status === 'SHARED';
  }

  // 自分が評価者の場合
  if (viewer.id === evaluation.evaluatorId) {
    return true;
  }

  // マネージャーの場合、部下の評価を見れる（実装簡略化のため、ここでは省略）
  
  return false;
}

export function canEditEvaluation(
  editor: { id: string; role: Role },
  evaluation: {
    evaluatorId: string;
    status: EvaluationStatus;
  }
): boolean {
  // 提出済みの評価は編集不可
  if (evaluation.status !== 'DRAFT') return false;

  // 評価者本人のみ編集可能
  return editor.id === evaluation.evaluatorId;
}

// コンピテンシーのデフォルト作成
export async function createDefaultCompetencies(organizationId: string) {
  const defaultCompetencies = [
    // コアコンピテンシー
    {
      name: 'コミュニケーション',
      description: '明確で効果的なコミュニケーションを行い、他者と協力する能力',
      category: CompetencyCategory.CORE,
      behaviors: [
        '明確で簡潔な情報伝達ができる',
        '積極的に傾聴し、フィードバックを求める',
        '異なる意見を尊重し、建設的な議論ができる',
      ],
      order: 1,
    },
    {
      name: 'チームワーク',
      description: 'チームの一員として協力し、共通の目標達成に貢献する能力',
      category: CompetencyCategory.CORE,
      behaviors: [
        'チームの目標を理解し、積極的に貢献する',
        '他のメンバーをサポートし、知識を共有する',
        '対立を建設的に解決する',
      ],
      order: 2,
    },
    {
      name: '問題解決',
      description: '課題を特定し、効果的な解決策を見つけて実行する能力',
      category: CompetencyCategory.CORE,
      behaviors: [
        '問題の根本原因を分析できる',
        '創造的な解決策を提案する',
        '解決策を実行し、結果を評価する',
      ],
      order: 3,
    },
    // リーダーシップコンピテンシー
    {
      name: 'ビジョン設定',
      description: '明確なビジョンを設定し、チームを導く能力',
      category: CompetencyCategory.LEADERSHIP,
      behaviors: [
        '将来の方向性を明確に示す',
        'チームメンバーを巻き込み、動機付ける',
        '変化に対して柔軟に対応する',
      ],
      order: 4,
    },
    {
      name: '人材育成',
      description: 'チームメンバーの成長と発展を支援する能力',
      category: CompetencyCategory.LEADERSHIP,
      behaviors: [
        'メンバーの強みと改善点を把握する',
        '建設的なフィードバックを提供する',
        '成長機会を創出する',
      ],
      order: 5,
    },
  ];

  const competencies = await prisma.competency.createMany({
    data: defaultCompetencies.map((comp) => ({
      ...comp,
      organizationId,
    })),
  });

  return competencies;
}

// 評価の提出
export async function submitEvaluation(evaluationId: string, userId: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      competencyRatings: true,
    },
  });

  if (!evaluation || evaluation.evaluatorId !== userId) {
    throw new Error('評価が見つからないか、権限がありません');
  }

  if (evaluation.status !== 'DRAFT') {
    throw new Error('すでに提出済みの評価です');
  }

  // 必須項目のチェック
  if (!evaluation.overallRating || evaluation.competencyRatings.length === 0) {
    throw new Error('必須項目を入力してください');
  }

  return prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });
}

// 評価結果の集計
export async function aggregateEvaluationResults(cycleId: string, evaluateeId: string) {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      cycleId,
      evaluateeId,
      status: { in: ['SUBMITTED', 'REVIEWED', 'APPROVED', 'SHARED'] },
    },
    include: {
      competencyRatings: {
        include: {
          competency: true,
        },
      },
    },
  });

  // タイプ別の平均評価
  const ratingsByType = evaluations.reduce((acc, evaluation) => {
    if (!evaluation.overallRating) return acc;
    
    if (!acc[evaluation.type]) {
      acc[evaluation.type] = { sum: 0, count: 0 };
    }
    acc[evaluation.type].sum += evaluation.overallRating;
    acc[evaluation.type].count += 1;
    
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  const averagesByType = Object.entries(ratingsByType).reduce((acc, [type, data]) => {
    acc[type] = data.count > 0 ? data.sum / data.count : 0;
    return acc;
  }, {} as Record<string, number>);

  // コンピテンシー別の平均評価
  const competencyRatings = evaluations.flatMap((evaluation) => evaluation.competencyRatings);
  const competencyAverages = competencyRatings.reduce((acc, rating) => {
    const key = rating.competencyId;
    if (!acc[key]) {
      acc[key] = {
        competency: rating.competency,
        sum: 0,
        count: 0,
      };
    }
    acc[key].sum += rating.rating;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { competency: any; sum: number; count: number }>);

  const competencyResults = Object.values(competencyAverages).map((data) => ({
    competency: data.competency,
    averageRating: data.count > 0 ? data.sum / data.count : 0,
    ratingCount: data.count,
  }));

  return {
    evaluationCount: evaluations.length,
    averagesByType,
    competencyResults,
    overallAverage: evaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0) / evaluations.length,
  };
}