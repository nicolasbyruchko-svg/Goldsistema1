-- AlterTable
ALTER TABLE "User" DROP COLUMN "email";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN "username" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
