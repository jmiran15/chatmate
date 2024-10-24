-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('WEBSITE', 'FILE', 'RAW', 'QA');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "WidgetPosition" AS ENUM ('BOTTOM_RIGHT', 'BOTTOM_LEFT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('REQUESTED_LIVE_CHAT', 'AGENT_JOINED', 'AGENT_LEFT');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('INITIAL_LOAD', 'CUSTOM_EVENT');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('text', 'textarea', 'date', 'url', 'phone', 'email', 'checkbox', 'select', 'number', 'rating', 'scale', 'slider');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('TEXT', 'FORM');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('BROAD', 'EXACT');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('GENERATIVE', 'STATIC');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "name" TEXT,
    "picture" TEXT,
    "provider" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "digits" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "charSet" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Chatbot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicName" TEXT NOT NULL DEFAULT 'Your Chatbot',
    "introMessages" TEXT[] DEFAULT ARRAY['Hello, how can I help you today?']::TEXT[],
    "model" TEXT DEFAULT 'gpt-4o',
    "responseLength" TEXT DEFAULT 'long',
    "systemPrompt" TEXT,
    "openIcon" TEXT NOT NULL DEFAULT 'plus',
    "themeColor" TEXT NOT NULL DEFAULT 'zinc',
    "starterQuestions" TEXT[] DEFAULT ARRAY['What are your features?']::TEXT[],
    "croppedLogoFilepath" TEXT,
    "lastCrop" JSONB,
    "originalLogoFilepath" TEXT,
    "containerRadius" TEXT DEFAULT '1.0',
    "openButtonText" TEXT,
    "widgetRestrictedUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "embeddedOn" TEXT,
    "installed" BOOLEAN NOT NULL DEFAULT false,
    "lastPingedAt" TIMESTAMP(3),
    "widgetPosition" "WidgetPosition" DEFAULT 'BOTTOM_RIGHT',

    CONSTRAINT "Chatbot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cluster" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commonChatbotId" TEXT NOT NULL,
    "gapChatbotId" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "chatbotId" TEXT NOT NULL,
    "name" TEXT DEFAULT 'Untitled Chat',
    "aiInsights" TEXT,
    "starred" BOOLEAN DEFAULT false,
    "sessionId" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "seen" BOOLEAN DEFAULT false,
    "referrer" TEXT,
    "status" "TicketStatus" DEFAULT 'OPEN',
    "elapsedMs" INTEGER NOT NULL DEFAULT 0,
    "hasLoadedInitialMessages" BOOLEAN DEFAULT false,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ffffff',
    "chatbotId" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousUser" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "city" TEXT,
    "region" TEXT,
    "region_code" TEXT,
    "country" TEXT,
    "country_code" TEXT,
    "country_code_iso3" TEXT,
    "country_name" TEXT,
    "country_capital" TEXT,
    "country_tld" TEXT,
    "country_area" DOUBLE PRECISION,
    "country_population" DOUBLE PRECISION,
    "continent_code" TEXT,
    "in_eu" BOOLEAN,
    "postal" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "latlong" TEXT,
    "timezone" TEXT,
    "utc_offset" TEXT,
    "country_calling_code" TEXT,
    "currency" TEXT,
    "currency_name" TEXT,
    "languages" TEXT,
    "asn" TEXT,
    "org" TEXT,
    "hostname" TEXT,
    "ua" TEXT,
    "browser_name" TEXT,
    "browser_version" TEXT,
    "browser_major" TEXT,
    "cpu_architecture" TEXT,
    "device_type" TEXT,
    "device_vendor" TEXT,
    "device_model" TEXT,
    "engine_name" TEXT,
    "engine_version" TEXT,
    "os_name" TEXT,
    "os_version" TEXT,
    "network" TEXT,
    "version" TEXT,
    "chatId" TEXT,
    "email" TEXT,

    CONSTRAINT "AnonymousUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "chatbotId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'RAW',
    "isPending" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT,
    "filepath" TEXT,
    "question" TEXT,
    "matchType" "MatchType" DEFAULT 'BROAD',
    "responseType" "ResponseType" DEFAULT 'GENERATIVE',

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embedding" vector(1536) NOT NULL,
    "documentId" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isQA" BOOLEAN DEFAULT false,
    "responseType" "ResponseType" DEFAULT 'GENERATIVE',

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "clusterId" TEXT,
    "seenByUser" BOOLEAN DEFAULT false,
    "seenByAgent" BOOLEAN DEFAULT false,
    "seenByUserAt" TIMESTAMP(3),
    "activity" "ActivityType",
    "isFormMessage" BOOLEAN DEFAULT false,
    "formId" TEXT,
    "flowId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formId" TEXT NOT NULL,
    "submissionData" JSONB NOT NULL,
    "messageId" TEXT,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "ToolCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" TEXT,

    CONSTRAINT "ToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolFunction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "arguments" TEXT,
    "toolCallId" TEXT NOT NULL,

    CONSTRAINT "ToolFunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" INTEGER NOT NULL,
    "currentPeriodEnd" INTEGER NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChatToLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_customerId_key" ON "User"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_target_type_key" ON "Verification"("target", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Password_userId_key" ON "Password"("userId");

-- CreateIndex
CREATE INDEX "Chatbot_userId_createdAt_idx" ON "Chatbot"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Chat_chatbotId_deleted_createdAt_idx" ON "Chat"("chatbotId", "deleted", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Label_chatbotId_name_key" ON "Label"("chatbotId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousUser_sessionId_key" ON "AnonymousUser"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousUser_chatId_key" ON "AnonymousUser"("chatId");

-- CreateIndex
CREATE INDEX "AnonymousUser_chatId_idx" ON "AnonymousUser"("chatId");

-- CreateIndex
CREATE INDEX "Document_chatbotId_type_isPending_createdAt_updatedAt_quest_idx" ON "Document"("chatbotId", "type", "isPending", "createdAt", "updatedAt", "question", "matchType");

-- CreateIndex
CREATE INDEX "Embedding_documentId_isQA_responseType_idx" ON "Embedding"("documentId", "isQA", "responseType");

-- CreateIndex
CREATE INDEX "Message_chatId_role_idx" ON "Message"("chatId", "role");

-- CreateIndex
CREATE INDEX "Form_chatbotId_idx" ON "Form"("chatbotId");

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_messageId_key" ON "FormSubmission"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Trigger_flowId_key" ON "Trigger"("flowId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolFunction_toolCallId_key" ON "ToolFunction"("toolCallId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_id_key" ON "Subscription"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_ChatToLabel_AB_unique" ON "_ChatToLabel"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatToLabel_B_index" ON "_ChatToLabel"("B");

-- AddForeignKey
ALTER TABLE "Password" ADD CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chatbot" ADD CONSTRAINT "Chatbot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_commonChatbotId_fkey" FOREIGN KEY ("commonChatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_gapChatbotId_fkey" FOREIGN KEY ("gapChatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousUser" ADD CONSTRAINT "AnonymousUser_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormElement" ADD CONSTRAINT "FormElement_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "ToolCall" ADD CONSTRAINT "ToolCall_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolFunction" ADD CONSTRAINT "ToolFunction_toolCallId_fkey" FOREIGN KEY ("toolCallId") REFERENCES "ToolCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToLabel" ADD CONSTRAINT "_ChatToLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToLabel" ADD CONSTRAINT "_ChatToLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
