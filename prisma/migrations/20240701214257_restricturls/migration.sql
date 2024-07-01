-- AlterTable
ALTER TABLE "Chatbot" ADD COLUMN     "widgetRestrictedUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
