-- CreateEnum
CREATE TYPE "ObjectiveOwner" AS ENUM ('COMPANY', 'TEAM', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "OkrCycle" AS ENUM ('ANNUAL', 'Q1', 'Q2', 'Q3', 'Q4');

-- CreateEnum
CREATE TYPE "ObjectiveStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KeyResultType" AS ENUM ('METRIC', 'MILESTONE');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvaluationCycleType" AS ENUM ('ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvaluationPhaseType" AS ENUM ('SELF', 'PEER', 'MANAGER', 'SKIP_LEVEL', 'CALIBRATION');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('SELF', 'PEER', 'MANAGER', 'SKIP_LEVEL', 'UPWARD');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'SHARED');

-- CreateEnum
CREATE TYPE "CompetencyCategory" AS ENUM ('CORE', 'LEADERSHIP', 'TECHNICAL', 'FUNCTIONAL');

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerType" "ObjectiveOwner" NOT NULL,
    "ownerUserId" TEXT,
    "ownerTeamId" TEXT,
    "parentId" TEXT,
    "cycle" "OkrCycle" NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "ObjectiveStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyResult" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "KeyResultType" NOT NULL,
    "ownerId" TEXT,
    "startValue" DOUBLE PRECISION,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "unit" TEXT,
    "milestoneStatus" "MilestoneStatus",
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OkrCheckIn" (
    "id" TEXT NOT NULL,
    "keyResultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "progress" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "comment" TEXT,
    "blockers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OkrCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCycle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EvaluationCycleType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationPhase" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "type" "EvaluationPhaseType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EvaluationPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "evaluateeId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "type" "EvaluationType" NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "overallRating" INTEGER,
    "overallComments" TEXT,
    "strengths" TEXT,
    "improvements" TEXT,
    "careerGoals" TEXT,
    "developmentPlan" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyRating" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "evidence" TEXT,

    CONSTRAINT "CompetencyRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competency" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "CompetencyCategory" NOT NULL,
    "behaviors" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Objective_organizationId_idx" ON "Objective"("organizationId");

-- CreateIndex
CREATE INDEX "Objective_ownerUserId_idx" ON "Objective"("ownerUserId");

-- CreateIndex
CREATE INDEX "Objective_ownerTeamId_idx" ON "Objective"("ownerTeamId");

-- CreateIndex
CREATE INDEX "Objective_parentId_idx" ON "Objective"("parentId");

-- CreateIndex
CREATE INDEX "Objective_cycle_year_idx" ON "Objective"("cycle", "year");

-- CreateIndex
CREATE INDEX "KeyResult_objectiveId_idx" ON "KeyResult"("objectiveId");

-- CreateIndex
CREATE INDEX "KeyResult_ownerId_idx" ON "KeyResult"("ownerId");

-- CreateIndex
CREATE INDEX "OkrCheckIn_keyResultId_idx" ON "OkrCheckIn"("keyResultId");

-- CreateIndex
CREATE INDEX "OkrCheckIn_userId_idx" ON "OkrCheckIn"("userId");

-- CreateIndex
CREATE INDEX "OkrCheckIn_createdAt_idx" ON "OkrCheckIn"("createdAt");

-- CreateIndex
CREATE INDEX "EvaluationCycle_organizationId_idx" ON "EvaluationCycle"("organizationId");

-- CreateIndex
CREATE INDEX "EvaluationCycle_status_idx" ON "EvaluationCycle"("status");

-- CreateIndex
CREATE INDEX "EvaluationPhase_cycleId_idx" ON "EvaluationPhase"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationPhase_cycleId_order_key" ON "EvaluationPhase"("cycleId", "order");

-- CreateIndex
CREATE INDEX "Evaluation_cycleId_idx" ON "Evaluation"("cycleId");

-- CreateIndex
CREATE INDEX "Evaluation_evaluateeId_idx" ON "Evaluation"("evaluateeId");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatorId_idx" ON "Evaluation"("evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_cycleId_evaluateeId_evaluatorId_type_key" ON "Evaluation"("cycleId", "evaluateeId", "evaluatorId", "type");

-- CreateIndex
CREATE INDEX "CompetencyRating_evaluationId_idx" ON "CompetencyRating"("evaluationId");

-- CreateIndex
CREATE INDEX "CompetencyRating_competencyId_idx" ON "CompetencyRating"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyRating_evaluationId_competencyId_key" ON "CompetencyRating"("evaluationId", "competencyId");

-- CreateIndex
CREATE INDEX "Competency_organizationId_idx" ON "Competency"("organizationId");

-- CreateIndex
CREATE INDEX "Competency_category_idx" ON "Competency"("category");

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyResult" ADD CONSTRAINT "KeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyResult" ADD CONSTRAINT "KeyResult_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OkrCheckIn" ADD CONSTRAINT "OkrCheckIn_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OkrCheckIn" ADD CONSTRAINT "OkrCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCycle" ADD CONSTRAINT "EvaluationCycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationPhase" ADD CONSTRAINT "EvaluationPhase_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluateeId_fkey" FOREIGN KEY ("evaluateeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyRating" ADD CONSTRAINT "CompetencyRating_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyRating" ADD CONSTRAINT "CompetencyRating_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
