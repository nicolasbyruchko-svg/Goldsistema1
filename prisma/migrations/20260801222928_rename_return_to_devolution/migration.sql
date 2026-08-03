-- AlterTable
ALTER TABLE "Return" RENAME TO "Devolution";
ALTER TABLE "ReturnItem" RENAME TO "DevolutionItem";

-- AlterColumn
ALTER TABLE "DevolutionItem" RENAME COLUMN "returnId" TO "devolutionId";

-- RenameIndex
ALTER INDEX "Return_pkey" RENAME TO "Devolution_pkey";
ALTER INDEX "ReturnItem_pkey" RENAME TO "DevolutionItem_pkey";

-- RenameForeignKey
ALTER TABLE "Devolution" RENAME CONSTRAINT "Return_workerId_fkey" TO "Devolution_workerId_fkey";
ALTER TABLE "Devolution" RENAME CONSTRAINT "Return_projectId_fkey" TO "Devolution_projectId_fkey";
ALTER TABLE "DevolutionItem" RENAME CONSTRAINT "ReturnItem_returnId_fkey" TO "DevolutionItem_devolutionId_fkey";
ALTER TABLE "DevolutionItem" RENAME CONSTRAINT "ReturnItem_productId_fkey" TO "DevolutionItem_productId_fkey";
