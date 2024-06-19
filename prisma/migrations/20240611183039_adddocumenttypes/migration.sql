-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('WEBSITE', 'FILE', 'RAW');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "type" "DocumentType" NOT NULL DEFAULT 'RAW';
