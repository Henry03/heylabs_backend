/*
  Warnings:

  - You are about to drop the column `userId` on the `ApiUsageLog` table. All the data in the column will be lost.
  - Added the required column `errorcode` to the `ApiUsageLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `ApiUsageLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ApiUsageLog" DROP CONSTRAINT "ApiUsageLog_userId_fkey";

-- AlterTable
ALTER TABLE "ApiUsageLog" DROP COLUMN "userId",
ADD COLUMN     "errorcode" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
