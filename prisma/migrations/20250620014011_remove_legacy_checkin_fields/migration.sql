/*
  Warnings:

  - You are about to drop the column `achievements` on the `CheckIn` table. All the data in the column will be lost.
  - You are about to drop the column `challenges` on the `CheckIn` table. All the data in the column will be lost.
  - You are about to drop the column `nextWeekGoals` on the `CheckIn` table. All the data in the column will be lost.
  - Made the column `templateId` on table `CheckIn` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_templateId_fkey";

-- AlterTable
ALTER TABLE "CheckIn" DROP COLUMN "achievements",
DROP COLUMN "challenges",
DROP COLUMN "nextWeekGoals",
ALTER COLUMN "answers" DROP DEFAULT,
ALTER COLUMN "templateId" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CheckInTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
