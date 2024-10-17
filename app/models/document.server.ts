import { Chatbot, Document } from "@prisma/client";

import { prisma } from "~/db.server";
export type { Chatbot } from "@prisma/client";

// function to create a single document
// probably revamp this function to use Pick<Document, "name" | "content" | "chatbotId" | "type">
export async function createDocument({
  name,
  content,
  chatbotId,
  type,
}: {
  name: Document["name"];
  content: Document["content"];
  chatbotId: Document["chatbotId"];
  type: Document["type"];
}) {
  return prisma.document.create({ data: { name, content, chatbotId, type } });
}

// function to createMany documents at once
export async function createDocuments({
  documents,
}: {
  documents: Partial<Document>[];
}) {
  return prisma.document.createManyAndReturn({ data: documents });
}

// function to fetch documents by a chatbotid
export const getDocumentsByChatbotId = async ({
  chatbotId,
}: {
  chatbotId: Chatbot["id"];
}) => {
  return prisma.document.findMany({
    where: { chatbotId },
    orderBy: { createdAt: "desc" },
  });
};

// get a single document by id
export const getDocumentById = async ({ id }: { id: Document["id"] }) => {
  return prisma.document.findUnique({ where: { id } });
};

// update a document name and content by id
export const updateDocumentById = async ({
  id,
  name,
  content,
}: {
  id: Document["id"];
  name: Document["name"];
  content: Document["content"];
}) => {
  return prisma.document.update({
    where: { id },
    data: { name, content },
  });
};

// delete a document by id
export const deleteDocumentById = async ({ id }: { id: Document["id"] }) => {
  return prisma.document.delete({ where: { id } });
};

export const updateDocument = async ({
  id,
  data,
}: {
  id: Document["id"];
  data: Partial<Document>;
}) => {
  return prisma.document.update({ where: { id }, data });
};
