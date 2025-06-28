import { prisma } from '@/lib/prisma';
import {
  EvaluationCycleType,
  EvaluationPhaseType,
  EvaluationType,
  EvaluationStatus,
  CompetencyCategory,
  Role,
} from '@prisma/client';

// Create evaluation cycle
export async function createEvaluationCycle(data: {
  organizationId: string;
  name: string;
  type: EvaluationCycleType;
  startDate: Date;
  endDate: Date;
}): Promise<Awaited<ReturnType<typeof prisma.evaluationCycle.create>>> {
  // Default phase settings
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

// Generate default phases
function getDefaultPhases(
  _type: EvaluationCycleType,
  startDate: Date,
  endDate: Date,
): Array<{
  type: EvaluationPhaseType;
  name: string;
  description: string;
  order: number;
  startDate: Date;
  endDate: Date;
}> {
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const phases = [
    {
      type: EvaluationPhaseType.SELF,
      name: 'Self Evaluation',
      description: 'Reflect on your achievements and growth',
      order: 1,
      durationRatio: 0.3,
    },
    {
      type: EvaluationPhaseType.PEER,
      name: 'Peer Evaluation',
      description: 'Feedback from colleagues',
      order: 2,
      durationRatio: 0.3,
    },
    {
      type: EvaluationPhaseType.MANAGER,
      name: 'Manager Evaluation',
      description: 'Evaluation and feedback from manager',
      order: 3,
      durationRatio: 0.3,
    },
    {
      type: EvaluationPhaseType.CALIBRATION,
      name: 'Calibration',
      description: 'Evaluation adjustment and finalization',
      order: 4,
      durationRatio: 0.1,
    },
  ];

  const currentDate = new Date(startDate);

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

// Automatically generate evaluation subjects
export async function generateEvaluations(
  cycleId: string,
  organizationId: string,
): Promise<number> {
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    include: { phases: true },
  });

  if (!cycle || cycle.organizationId !== organizationId) {
    throw new Error('Evaluation cycle not found');
  }

  // Get all active users in the organization
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
    // Self evaluation
    evaluations.push({
      cycleId,
      evaluateeId: user.id,
      evaluatorId: user.id,
      type: EvaluationType.SELF,
    });

    // Manager evaluation (from team manager)
    const managedTeams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
        managerId: { not: null },
      },
    });

    for (const team of managedTeams) {
      if (
        team.managerId !== null &&
        team.managerId !== undefined &&
        team.managerId.length > 0 &&
        team.managerId !== user.id
      ) {
        evaluations.push({
          cycleId,
          evaluateeId: user.id,
          evaluatorId: team.managerId,
          type: EvaluationType.MANAGER,
        });
      }
    }

    // Peer evaluation (up to 3 members from the same team)
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

  // Remove duplicates and save to database
  const uniqueEvaluations = evaluations.filter(
    (evaluation, index, self) =>
      index ===
      self.findIndex(
        (e) =>
          e.evaluateeId === evaluation.evaluateeId &&
          e.evaluatorId === evaluation.evaluatorId &&
          e.type === evaluation.type,
      ),
  );

  await prisma.evaluation.createMany({
    data: uniqueEvaluations,
    skipDuplicates: true,
  });

  return uniqueEvaluations.length;
}

// Check evaluation permissions
export function canViewEvaluation(
  viewer: { id: string; role: Role },
  evaluation: {
    evaluateeId: string;
    evaluatorId: string;
    type: EvaluationType;
    status: EvaluationStatus;
    isVisible: boolean;
  },
): boolean {
  // Admins can view all
  if (viewer.role === 'ADMIN') return true;

  // If viewer is evaluatee
  if (viewer.id === evaluation.evaluateeId) {
    // Only visible evaluations
    return evaluation.isVisible || evaluation.status === 'SHARED';
  }

  // If viewer is evaluator
  if (viewer.id === evaluation.evaluatorId) {
    return true;
  }

  // Managers can view subordinates' evaluations (simplified implementation omitted)

  return false;
}

export function canEditEvaluation(
  editor: { id: string; role: Role },
  evaluation: {
    evaluatorId: string;
    status: EvaluationStatus;
  },
): boolean {
  // Cannot edit submitted evaluations
  if (evaluation.status !== 'DRAFT') return false;

  // Only evaluator can edit
  return editor.id === evaluation.evaluatorId;
}

// Default competencies creation
export async function createDefaultCompetencies(
  organizationId: string,
): Promise<Awaited<ReturnType<typeof prisma.competency.createMany>>> {
  const defaultCompetencies = [
    // Core competencies
    {
      name: 'Communication',
      description: 'Ability to communicate clearly and effectively, and collaborate with others',
      category: CompetencyCategory.CORE,
      behaviors: [
        'Can communicate information clearly and concisely',
        'Actively listens and seeks feedback',
        'Respects different opinions and engages in constructive discussions',
      ],
      order: 1,
    },
    {
      name: 'Teamwork',
      description:
        'Ability to collaborate as a team member and contribute to achieving common goals',
      category: CompetencyCategory.CORE,
      behaviors: [
        'Understands team goals and actively contributes',
        'Supports other members and shares knowledge',
        'Resolves conflicts constructively',
      ],
      order: 2,
    },
    {
      name: 'Problem Solving',
      description: 'Ability to identify issues, find effective solutions, and execute them',
      category: CompetencyCategory.CORE,
      behaviors: [
        'Can analyze root causes of problems',
        'Proposes creative solutions',
        'Executes solutions and evaluates results',
      ],
      order: 3,
    },
    // Leadership competencies
    {
      name: 'Vision Setting',
      description: 'Ability to set clear vision and lead the team',
      category: CompetencyCategory.LEADERSHIP,
      behaviors: [
        'Clearly shows future direction',
        'Engages and motivates team members',
        'Responds flexibly to changes',
      ],
      order: 4,
    },
    {
      name: 'Talent Development',
      description: 'Ability to support team members growth and development',
      category: CompetencyCategory.LEADERSHIP,
      behaviors: [
        'Understands members strengths and areas for improvement',
        'Provides constructive feedback',
        'Creates growth opportunities',
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

// Submit evaluation
export async function submitEvaluation(
  evaluationId: string,
  userId: string,
): Promise<Awaited<ReturnType<typeof prisma.evaluation.update>>> {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      competencyRatings: true,
    },
  });

  if (!evaluation || evaluation.evaluatorId !== userId) {
    throw new Error('Evaluation not found or no permission');
  }

  if (evaluation.status !== 'DRAFT') {
    throw new Error('Evaluation already submitted');
  }

  // Check required fields
  if (
    evaluation.overallRating === null ||
    evaluation.overallRating === undefined ||
    evaluation.competencyRatings.length === 0
  ) {
    throw new Error('Please fill in required fields');
  }

  return prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });
}

// Aggregate evaluation results
export async function aggregateEvaluationResults(
  cycleId: string,
  evaluateeId: string,
): Promise<{
  evaluationCount: number;
  averagesByType: Record<string, number>;
  competencyResults: Array<{
    competency: unknown;
    averageRating: number;
    ratingCount: number;
  }>;
  overallAverage: number;
}> {
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
  const ratingsByType = evaluations.reduce(
    (acc, evaluation) => {
      if (evaluation.overallRating === null || evaluation.overallRating === undefined) return acc;

      if (!acc[evaluation.type]) {
        acc[evaluation.type] = { sum: 0, count: 0 };
      }
      const typeData = acc[evaluation.type];
      if (typeData) {
        typeData.sum += evaluation.overallRating;
        typeData.count += 1;
      }

      return acc;
    },
    {} as Record<string, { sum: number; count: number }>,
  );

  const averagesByType = Object.entries(ratingsByType).reduce(
    (acc, [type, data]) => {
      acc[type] = data.count > 0 ? data.sum / data.count : 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  // コンピテンシー別の平均評価
  const competencyRatings = evaluations.flatMap((evaluation) => evaluation.competencyRatings);
  const competencyAverages = competencyRatings.reduce(
    (acc, rating) => {
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
    },
    {} as Record<string, { competency: unknown; sum: number; count: number }>,
  );

  const competencyResults = Object.values(competencyAverages).map((data) => ({
    competency: data.competency,
    averageRating: data.count > 0 ? data.sum / data.count : 0,
    ratingCount: data.count,
  }));

  return {
    evaluationCount: evaluations.length,
    averagesByType,
    competencyResults,
    overallAverage:
      evaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating ?? 0), 0) /
      (evaluations.length > 0 ? evaluations.length : 1),
  };
}
