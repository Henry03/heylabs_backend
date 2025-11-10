-- DropForeignKey
ALTER TABLE "public"."ApiUsageLog" DROP CONSTRAINT "ApiUsageLog_apiEndpointId_fkey";

-- AlterTable
ALTER TABLE "ApiUsageLog" ALTER COLUMN "apiEndpointId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_apiEndpointId_fkey" FOREIGN KEY ("apiEndpointId") REFERENCES "ApiEndpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
