import {
  Objective,
  KeyResult,
  OkrCheckIn,
  ObjectiveOwner,
  OkrCycle,
  ObjectiveStatus,
  KeyResultType,
  MilestoneStatus,
  User,
  Team,
  Organization,
} from '@prisma/client';

// Extended types with relations
export type ObjectiveWithRelations = Objective & {
  organization: Organization;
  ownerUser?: User | null;
  ownerTeam?: Team | null;
  parent?: Objective | null;
  children?: Objective[];
  keyResults: KeyResultWithProgress[];
};

export type KeyResultWithProgress = KeyResult & {
  objective: Objective;
  owner?: User | null;
  checkIns: OkrCheckIn[];
  latestCheckIn?: OkrCheckIn | null;
};

export type OkrCheckInWithRelations = OkrCheckIn & {
  keyResult: KeyResult;
  user: User;
};

// Form types for creating/updating OKRs
export interface CreateObjectiveInput {
  title: string;
  description?: string;
  ownerType: ObjectiveOwner;
  ownerUserId?: string;
  ownerTeamId?: string;
  parentId?: string;
  cycle: OkrCycle;
  year: number;
  startDate: Date;
  endDate: Date;
  status?: ObjectiveStatus;
}

export interface CreateKeyResultInput {
  objectiveId: string;
  title: string;
  description?: string;
  type: KeyResultType;
  ownerId?: string;
  // For METRIC type
  startValue?: number;
  targetValue?: number;
  unit?: string;
  // For MILESTONE type
  milestoneStatus?: MilestoneStatus;
}

export interface UpdateKeyResultInput {
  title?: string;
  description?: string;
  ownerId?: string;
  // For METRIC type
  currentValue?: number;
  // For MILESTONE type
  milestoneStatus?: MilestoneStatus;
  // Progress tracking
  progress?: number;
  confidence?: number;
}

export interface CreateCheckInInput {
  keyResultId: string;
  currentValue?: number;
  progress: number;
  confidence?: number;
  comment?: string;
  blockers?: string;
}

// Utility types
export interface OkrSummary {
  totalObjectives: number;
  activeObjectives: number;
  completedObjectives: number;
  averageProgress: number;
  averageConfidence: number;
  keyResultsByType: {
    metric: number;
    milestone: number;
  };
  objectivesByCycle: Record<OkrCycle, number>;
}

export interface OkrAlignment {
  companyObjectives: ObjectiveWithRelations[];
  teamObjectives: Record<string, ObjectiveWithRelations[]>;
  individualObjectives: Record<string, ObjectiveWithRelations[]>;
}

// Helper functions for OKR calculations
export function calculateObjectiveProgress(objective: ObjectiveWithRelations): number {
  if (objective.keyResults.length === 0) return 0;

  const totalProgress = objective.keyResults.reduce((sum, kr) => sum + kr.progress, 0);
  return totalProgress / objective.keyResults.length;
}

export function calculateConfidence(objective: ObjectiveWithRelations): number {
  const keyResultsWithConfidence = objective.keyResults.filter((kr) => kr.confidence !== null);
  if (keyResultsWithConfidence.length === 0) return 0;

  const totalConfidence = keyResultsWithConfidence.reduce(
    (sum, kr) => sum + (kr.confidence ?? 0),
    0,
  );
  return totalConfidence / keyResultsWithConfidence.length;
}

export function getProgressColor(progress: number): string {
  if (progress >= 0.7) return 'text-green-600';
  if (progress >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
}

export function getCurrentQuarter(): OkrCycle {
  const month = new Date().getMonth();
  if (month < 3) return OkrCycle.Q1;
  if (month < 6) return OkrCycle.Q2;
  if (month < 9) return OkrCycle.Q3;
  return OkrCycle.Q4;
}

export function getQuarterDates(year: number, quarter: OkrCycle): { start: Date; end: Date } {
  const quarterMap = {
    [OkrCycle.Q1]: { start: 0, end: 2 },
    [OkrCycle.Q2]: { start: 3, end: 5 },
    [OkrCycle.Q3]: { start: 6, end: 8 },
    [OkrCycle.Q4]: { start: 9, end: 11 },
    [OkrCycle.ANNUAL]: { start: 0, end: 11 },
  };

  const { start, end } = quarterMap[quarter];
  return {
    start: new Date(year, start, 1),
    end: new Date(year, end + 1, 0),
  };
}
