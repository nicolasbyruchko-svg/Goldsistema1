-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "Devolution" ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "approvedByUserId" TEXT;

-- AlterTable
ALTER TABLE "DevolutionItem" ADD COLUMN "repairedByUserId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "updatedByUserId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseInvoice" ADD COLUMN "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Delivery_createdByUserId_idx" ON "Delivery"("createdByUserId");

-- CreateIndex
CREATE INDEX "Devolution_createdByUserId_idx" ON "Devolution"("createdByUserId");

-- CreateIndex
CREATE INDEX "Devolution_approvedByUserId_idx" ON "Devolution"("approvedByUserId");

-- CreateIndex
CREATE INDEX "DevolutionItem_repairedByUserId_idx" ON "DevolutionItem"("repairedByUserId");

-- CreateIndex
CREATE INDEX "Product_createdByUserId_idx" ON "Product"("createdByUserId");

-- CreateIndex
CREATE INDEX "Product_updatedByUserId_idx" ON "Product"("updatedByUserId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_createdByUserId_idx" ON "PurchaseInvoice"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolution" ADD CONSTRAINT "Devolution_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolution" ADD CONSTRAINT "Devolution_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolutionItem" ADD CONSTRAINT "DevolutionItem_repairedByUserId_fkey" FOREIGN KEY ("repairedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
