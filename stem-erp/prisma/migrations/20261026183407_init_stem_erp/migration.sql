-- CreateEnum
CREATE TYPE "DeliveryGroup" AS ENUM ('ENGINEERING_CAD', 'MANUFACTURING_CNC', 'PIT_DISPLAY', 'MARKETING_SPONSOR', 'PROJECT_MANAGEMENT');

-- CreateEnum
CREATE TYPE "AcquisitionStrategy" AS ENUM ('DIRECT_PURCHASE', 'FINANCIAL_SPONSOR', 'BARTER_PARTNERSHIP', 'OWN_FUNDS_RAFFLE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ORIGIN', 'APPLICATION');

-- CreateEnum
CREATE TYPE "TrackingMethod" AS ENUM ('NFE', 'RECEIPT', 'SPONSOR_CONTRACT', 'BANK_PIX_STATEMENT');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deliveryGroup" "DeliveryGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetResource" (
    "id" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetResource_code_key" ON "BudgetResource"("code");

-- CreateIndex
CREATE INDEX "BudgetResource_deliveryGroup_plannedMonth_idx" ON "BudgetResource"("deliveryGroup", "plannedMonth");

-- CreateIndex
CREATE INDEX "Transaction_referenceMonth_type_idx" ON "Transaction"("referenceMonth", "type");

-- CreateIndex
CREATE INDEX "Transaction_deliveryGroup_referenceMonth_idx" ON "Transaction"("deliveryGroup", "referenceMonth");

-- AddForeignKey
ALTER TABLE "BudgetResource" ADD CONSTRAINT "BudgetResource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_budgetResourceId_fkey" FOREIGN KEY ("budgetResourceId") REFERENCES "BudgetResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
