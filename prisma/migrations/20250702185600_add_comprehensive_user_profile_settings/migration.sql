-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('NEVER', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "checkinReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'WEEKLY',
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "kudosNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "locale" TEXT DEFAULT 'en',
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "surveyNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "teamUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC',
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "twitterUrl" TEXT;

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failReason" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_sessionToken_idx" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_isActive_idx" ON "UserSession"("isActive");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory"("userId");

-- CreateIndex
CREATE INDEX "LoginHistory_loginAt_idx" ON "LoginHistory"("loginAt");

-- CreateIndex
CREATE INDEX "LoginHistory_success_idx" ON "LoginHistory"("success");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;