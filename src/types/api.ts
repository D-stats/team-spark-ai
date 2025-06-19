/**
 * 統一API型定義
 * フロントエンドとバックエンド間の型安全性を保証する
 */

import { z } from 'zod';
import { 
  EvaluationType, 
  EvaluationStatus, 
  EvaluationCycleType, 
  CycleStatus,
  CompetencyCategory,
  Role 
} from '@prisma/client';

// ================
// 基本レスポンス型
// ================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ================
// 基本エンティティ型
// ================

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  memberCount: number;
}

// ================
// 評価関連型定義
// ================

export const EvaluationCycleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(EvaluationCycleType),
  status: z.nativeEnum(CycleStatus),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  selfEvaluationDeadline: z.coerce.date().optional(),
  managerEvaluationDeadline: z.coerce.date().optional(),
  calibrationDeadline: z.coerce.date().optional(),
  description: z.string().optional(),
  isAutoGenerate: z.boolean(),
  isVisible: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const EvaluationCycleWithStatsSchema = EvaluationCycleSchema.extend({
  _count: z.object({
    evaluations: z.number(),
  }),
  phases: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.nativeEnum(EvaluationType),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    order: z.number(),
  })),
});

export const CompetencySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.nativeEnum(CompetencyCategory),
  behaviors: z.array(z.string()),
  order: z.number(),
  isActive: z.boolean(),
  organizationId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CompetencyWithStatsSchema = CompetencySchema.extend({
  _count: z.object({
    ratings: z.number(),
  }),
});

export const CompetencyRatingSchema = z.object({
  id: z.string(),
  competencyId: z.string(),
  evaluationId: z.string(),
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
  behaviors: z.array(z.string()),
  examples: z.string().optional(),
  improvementAreas: z.string().optional(),
});

export const EvaluationSchema = z.object({
  id: z.string(),
  cycleId: z.string(),
  evaluateeId: z.string(),
  evaluatorId: z.string(),
  type: z.nativeEnum(EvaluationType),
  status: z.nativeEnum(EvaluationStatus),
  overallRating: z.number().min(1).max(5).optional(),
  overallComments: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  careerGoals: z.string().optional(),
  developmentPlan: z.string().optional(),
  isVisible: z.boolean(),
  submittedAt: z.coerce.date().optional(),
  reviewedAt: z.coerce.date().optional(),
  sharedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const EvaluationWithDetailsSchema = EvaluationSchema.extend({
  evaluatee: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.nativeEnum(Role),
    avatar: z.string().optional(),
  }),
  evaluator: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.nativeEnum(Role),
    avatar: z.string().optional(),
  }),
  cycle: z.object({
    id: z.string(),
    name: z.string(),
    type: z.nativeEnum(EvaluationCycleType),
    status: z.nativeEnum(CycleStatus),
  }),
  competencyRatings: z.array(CompetencyRatingSchema.extend({
    competency: CompetencySchema,
  })),
});

// ================
// API リクエスト型
// ================

export const CreateEvaluationCycleSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  type: z.nativeEnum(EvaluationCycleType),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  selfEvaluationDeadline: z.coerce.date().optional(),
  managerEvaluationDeadline: z.coerce.date().optional(),
  calibrationDeadline: z.coerce.date().optional(),
  description: z.string().optional(),
  isAutoGenerate: z.boolean().default(true),
  isVisible: z.boolean().default(true),
});

export const UpdateEvaluationCycleSchema = CreateEvaluationCycleSchema.partial();

export const CreateCompetencySchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  description: z.string().min(1, '説明は必須です'),
  category: z.nativeEnum(CompetencyCategory),
  behaviors: z.array(z.string()).min(1, '行動指標は1つ以上必要です'),
  order: z.number().min(0),
  isActive: z.boolean().default(true),
});

export const UpdateCompetencySchema = CreateCompetencySchema.partial();

export const SaveEvaluationSchema = z.object({
  overallRating: z.number().min(1).max(5).optional(),
  overallComments: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  careerGoals: z.string().optional(),
  developmentPlan: z.string().optional(),
  competencyRatings: z.array(z.object({
    competencyId: z.string(),
    rating: z.number().min(1).max(5),
    comments: z.string().optional(),
    behaviors: z.array(z.string()),
    examples: z.string().optional(),
    improvementAreas: z.string().optional(),
  })),
  isDraft: z.boolean().default(true),
});

export const SubmitEvaluationSchema = SaveEvaluationSchema.extend({
  isDraft: z.literal(false),
  overallRating: z.number().min(1).max(5),
  overallComments: z.string().min(1, '総合コメントは必須です'),
  competencyRatings: z.array(z.object({
    competencyId: z.string(),
    rating: z.number().min(1).max(5),
    comments: z.string().min(1, 'コメントは必須です'),
    behaviors: z.array(z.string()).min(1, '行動指標は1つ以上選択してください'),
    examples: z.string().optional(),
    improvementAreas: z.string().optional(),
  })).min(1, 'コンピテンシー評価は必須です'),
});

// ================
// 型エクスポート
// ================

export type EvaluationCycle = z.infer<typeof EvaluationCycleSchema>;
export type EvaluationCycleWithStats = z.infer<typeof EvaluationCycleWithStatsSchema>;
export type Competency = z.infer<typeof CompetencySchema>;
export type CompetencyWithStats = z.infer<typeof CompetencyWithStatsSchema>;
export type CompetencyRating = z.infer<typeof CompetencyRatingSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;
export type EvaluationWithDetails = z.infer<typeof EvaluationWithDetailsSchema>;

export type CreateEvaluationCycleRequest = z.infer<typeof CreateEvaluationCycleSchema>;
export type UpdateEvaluationCycleRequest = z.infer<typeof UpdateEvaluationCycleSchema>;
export type CreateCompetencyRequest = z.infer<typeof CreateCompetencySchema>;
export type UpdateCompetencyRequest = z.infer<typeof UpdateCompetencySchema>;
export type SaveEvaluationRequest = z.infer<typeof SaveEvaluationSchema>;
export type SubmitEvaluationRequest = z.infer<typeof SubmitEvaluationSchema>;

// ================
// Result型パターン
// ================

export type Result<T, E = ApiError> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = ApiError> = Promise<Result<T, E>>;

// ================
// API関数型定義
// ================

export interface EvaluationApi {
  // 評価サイクル
  getEvaluationCycles(): AsyncResult<EvaluationCycleWithStats[]>;
  createEvaluationCycle(data: CreateEvaluationCycleRequest): AsyncResult<EvaluationCycle>;
  updateEvaluationCycle(id: string, data: UpdateEvaluationCycleRequest): AsyncResult<EvaluationCycle>;
  deleteEvaluationCycle(id: string): AsyncResult<void>;

  // コンピテンシー
  getCompetencies(): AsyncResult<CompetencyWithStats[]>;
  createCompetency(data: CreateCompetencyRequest): AsyncResult<Competency>;
  updateCompetency(id: string, data: UpdateCompetencyRequest): AsyncResult<Competency>;
  deleteCompetency(id: string): AsyncResult<void>;

  // 評価
  getEvaluations(cycleId?: string): AsyncResult<EvaluationWithDetails[]>;
  getEvaluation(id: string): AsyncResult<EvaluationWithDetails>;
  saveEvaluation(id: string, data: SaveEvaluationRequest): AsyncResult<Evaluation>;
  submitEvaluation(id: string, data: SubmitEvaluationRequest): AsyncResult<Evaluation>;
  reviewEvaluation(id: string, approved: boolean, comments?: string): AsyncResult<Evaluation>;
  shareEvaluation(id: string): AsyncResult<Evaluation>;
}