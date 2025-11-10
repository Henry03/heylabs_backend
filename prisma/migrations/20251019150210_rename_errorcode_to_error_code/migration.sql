/*
  Warnings:

  - You are about to drop the column `errorcode` on the `ApiUsageLog` table. All the data in the column will be lost.
  - Added the required column `errorCode` to the `ApiUsageLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiUsageLog" DROP COLUMN "errorcode",
ADD COLUMN     "errorCode" TEXT NOT NULL;
