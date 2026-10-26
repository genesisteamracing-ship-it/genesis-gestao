-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DeliveryGroup" AS ENUM ('ENGINEERING_CAD', 'MANUFACTURING_CNC', 'PIT_DISPLAY', 'MARKETING_SPONSOR', 'PROJECT_MANAGEMENT');

-- CreateEnum
CREATE TYPE "AcquisitionStrategy" AS ENUM ('DIRECT_PURCHASE', 'FINANCIAL_SPONSOR', 'BARTER_PARTNERSHIP', 'OWN_FUNDS_RAFFLE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ORIGIN', 'APPLICATION');

-- CreateEnum
CREATE TYPE "TrackingMethod" AS ENUM ('NFE', 'RECEIPT', 'SPONSOR_CONTRACT', 'BANK_PIX_STATEMENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'FINANCE_MANAGER', 'TEAM_LEAD', 'AUDITOR');

-- CreateEnum
CREATE TYPE "AuthEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'LOGOUT', 'SESSION_REVOKED', 'USER_CREATED', 'USER_ROLE_UPDATED', 'TEAM_CREATED');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "schoolOrOrg" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deliveryGroup" "DeliveryGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetResource" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "deliveryGroup" "DeliveryGroup" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "acquisitionStrategy" "AcquisitionStrategy" NOT NULL,
    "allocatedTo" TEXT NOT NULL,
    "plannedMonth" INTEGER NOT NULL,
    "utilizationForecast" INTEGER NOT NULL,
    "plannedAmountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "deliveryGroup" "DeliveryGroup" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "budgetResourceId" TEXT,
    "description" TEXT NOT NULL,
    "trackingMethod" "TrackingMethod" NOT NULL,
    "documentRef" TEXT,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TEAM_LEAD',
    "teamId" TEXT,
    "deliveryGroup" "DeliveryGroup",
    "jobTitle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "emailAttempt" TEXT NOT NULL,
    "event" "AuthEventType" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_teamId_name_key" ON "Category"("teamId", "name");

-- CreateIndex
CREATE INDEX "BudgetResource_teamId_deliveryGroup_plannedMonth_idx" ON "BudgetResource"("teamId", "deliveryGroup", "plannedMonth");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetResource_teamId_code_key" ON "BudgetResource"("teamId", "code");

-- CreateIndex
CREATE INDEX "Transaction_teamId_referenceMonth_type_idx" ON "Transaction"("teamId", "referenceMonth", "type");

-- CreateIndex
CREATE INDEX "Transaction_teamId_deliveryGroup_referenceMonth_idx" ON "Transaction"("teamId", "deliveryGroup", "referenceMonth");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_teamId_role_idx" ON "User"("teamId", "role");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuthAuditLog_emailAttempt_createdAt_idx" ON "AuthAuditLog"("emailAttempt", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAuditLog_event_createdAt_idx" ON "AuthAuditLog"("event", "createdAt");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetResource" ADD CONSTRAINT "BudgetResource_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetResource" ADD CONSTRAINT "BudgetResource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_budgetResourceId_fkey" FOREIGN KEY ("budgetResourceId") REFERENCES "BudgetResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

