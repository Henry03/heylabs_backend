-- DropForeignKey
ALTER TABLE "public"."ApiUsageLog" DROP CONSTRAINT "ApiUsageLog_apiKeyId_fkey";

-- AlterTable
ALTER TABLE "ApiUsageLog" ALTER COLUMN "apiKeyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
