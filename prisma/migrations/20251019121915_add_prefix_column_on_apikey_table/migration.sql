/*
  Warnings:

  - A unique constraint covering the columns `[prefix]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- DropIndex
DROP INDEX "public"."ApiKey_key_key";

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "prefix" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");
