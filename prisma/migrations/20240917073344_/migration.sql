-- CreateEnum
CREATE TYPE "Trigger" AS ENUM ('INITIAL_LOAD', 'CUSTOM_EVENT');

-- AlterTable
ALTER TABLE "Flow" ADD COLUMN     "trigger" "Trigger" NOT NULL DEFAULT 'INITIAL_LOAD';
