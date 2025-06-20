-- CreateEnum
CREATE TYPE "CheckInFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM');

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "answers" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "achievements" DROP NOT NULL,
ALTER COLUMN "moodRating" DROP NOT NULL,
ALTER COLUMN "nextWeekGoals" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CheckInTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "CheckInFrequency" NOT NULL DEFAULT 'WEEKLY',
    "questions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckInTemplate_organizationId_idx" ON "CheckInTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "CheckInTemplate_isActive_idx" ON "CheckInTemplate"("isActive");

-- CreateIndex
CREATE INDEX "CheckIn_templateId_idx" ON "CheckIn"("templateId");

-- AddForeignKey
ALTER TABLE "CheckInTemplate" ADD CONSTRAINT "CheckInTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CheckInTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
