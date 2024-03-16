-- AlterTable
ALTER TABLE "Chatbot" ADD COLUMN     "starterQuestions" TEXT[] DEFAULT ARRAY['What are your features?']::TEXT[];
