/*
  Warnings:

  - You are about to drop the column `goals` on the `CheckIn` table. All the data in the column will be lost.
  - You are about to drop the column `moodScore` on the `CheckIn` table. All the data in the column will be lost.
  - You are about to drop the column `support` on the `CheckIn` table. All the data in the column will be lost.
  - Added the required column `moodRating` to the `CheckIn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextWeekGoals` to the `CheckIn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CheckIn" DROP COLUMN "goals",
DROP COLUMN "moodScore",
DROP COLUMN "support",
ADD COLUMN     "moodRating" INTEGER NOT NULL,
ADD COLUMN     "nextWeekGoals" TEXT NOT NULL,
ALTER COLUMN "achievements" SET DATA TYPE TEXT;
