-- CreateTable
CREATE TABLE "widget_configs" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "amounts" JSONB NOT NULL,
    "allowRecurring" BOOLEAN NOT NULL DEFAULT true,
    "allowCoverageFee" BOOLEAN NOT NULL DEFAULT true,
    "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 2.9,
    "feeFixed" INTEGER NOT NULL DEFAULT 30,
    "minAmount" INTEGER NOT NULL DEFAULT 100,
    "maxAmount" INTEGER NOT NULL DEFAULT 99999900,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "causes" JSONB,
    "theme" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "widget_configs_siteId_key" ON "widget_configs"("siteId");

-- CreateIndex
CREATE INDEX "widget_configs_siteId_idx" ON "widget_configs"("siteId");

-- CreateIndex
CREATE INDEX "widget_configs_isActive_idx" ON "widget_configs"("isActive");
