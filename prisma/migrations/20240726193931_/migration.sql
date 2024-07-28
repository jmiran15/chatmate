/*
  Warnings:

  - Made the column `color` on table `Label` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "elapsedNs" BIGINT DEFAULT 0;

-- AlterTable
ALTER TABLE "Label" ALTER COLUMN "color" SET NOT NULL;
