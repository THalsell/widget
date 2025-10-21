-- AlterTable
ALTER TABLE "widget_configs" ADD COLUMN     "platformFeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "widget_configs_stripeConnectAccountId_idx" ON "widget_configs"("stripeConnectAccountId");
