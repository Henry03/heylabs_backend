/*
  Warnings:

  - Made the column `userId` on table `ApiUsageLog` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."ApiUsageLog" DROP CONSTRAINT "ApiUsageLog_userId_fkey";

-- AlterTable
ALTER TABLE "ApiUsageLog" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
