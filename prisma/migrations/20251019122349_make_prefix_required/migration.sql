/*
  Warnings:

  - Made the column `prefix` on table `ApiKey` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ApiKey" ALTER COLUMN "prefix" SET NOT NULL;
