/*
  Warnings:

  - You are about to drop the column `flowSchema` on the `Flow` table. All the data in the column will be lost.
  - You are about to drop the column `trigger` on the `Flow` table. All the data in the column will be lost.
  - You are about to drop the column `formSchema` on the `Form` table. All the data in the column will be lost.
  - You are about to drop the `Plan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Price` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[chatbotId,name]` on the table `Label` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('INITIAL_LOAD', 'CUSTOM_EVENT');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('text', 'textarea', 'date', 'url', 'phone', 'email', 'checkbox', 'select', 'number', 'rating', 'scale', 'slider');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('TEXT', 'FORM');

-- DropForeignKey
ALTER TABLE "Price" DROP CONSTRAINT "Price_planId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_priceId_fkey";

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "hasLoadedInitialMessages" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Flow" DROP COLUMN "flowSchema",
DROP COLUMN "trigger";

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "formSchema";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "flowId" TEXT;

-- DropTable
DROP TABLE "Plan";

-- DropTable
DROP TABLE "Price";

-- DropEnum
DROP TYPE "Trigger";

-- CreateTable
CREATE TABLE "FormElement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formId" TEXT NOT NULL,
    "type" "InputType" NOT NULL DEFAULT 'text',
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "description" TEXT,
    "options" TEXT[],
    "min" INTEGER,
    "max" INTEGER,
    "step" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "required_error" TEXT DEFAULT 'This field is required',
    "min_error" TEXT DEFAULT 'Please enter a value greater than the minimum',
    "max_error" TEXT DEFAULT 'Please enter a value less than the maximum',
    "invalid_type_error" TEXT DEFAULT 'Please enter a valid value',

    CONSTRAINT "FormElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trigger" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "TriggerType" NOT NULL DEFAULT 'INITIAL_LOAD',
    "description" TEXT,
    "flowId" TEXT NOT NULL,

    CONSTRAINT "Trigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ActionType" NOT NULL DEFAULT 'TEXT',
    "formId" TEXT,
    "text" TEXT,
    "delay" INTEGER,
    "flowId" TEXT NOT NULL,
    "order" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormsOnActions" (
    "actionId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,

    CONSTRAINT "FormsOnActions_pkey" PRIMARY KEY ("actionId","formId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trigger_flowId_key" ON "Trigger"("flowId");

-- CreateIndex
CREATE INDEX "Form_chatbotId_idx" ON "Form"("chatbotId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_chatbotId_name_key" ON "Label"("chatbotId", "name");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormElement" ADD CONSTRAINT "FormElement_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormsOnActions" ADD CONSTRAINT "FormsOnActions_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormsOnActions" ADD CONSTRAINT "FormsOnActions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
