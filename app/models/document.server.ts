import PDFParser from "pdf2json";

import { Chatbot, Document, Embedding } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";
import { embed } from "~/utils/openai";
export type { Chatbot } from "@prisma/client";

// function to create multiple documents at once:

// also need to create embeddings for those documents and push
// inside this same function we can do the following
//  - after we created the documents in db, we get their ids
//  - then for each document, pass it through splitter, with overlap
//  - then generate embedding objects for the splits, with the chatbot id, and document id (so that we can delete them later)
//  - this should be all we need in this function

export async function createDocuments({
  documents,
}: {
  documents: Pick<Document, "name" | "content" | "chatbotId">[];
}) {
  // call createDocumentWithEmbeddings for each document
  const documentObjects = await Promise.all(
    documents.map(async (document) => {
      return createDocumentWithEmbeddings({ document });
    }),
  );

  return documentObjects;
}

function splitTextIntoChunks(text: string, chunkSize: number, overlap: number) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function createDocumentWithEmbeddings({
  document,
}: {
  document: Pick<Document, "name" | "content" | "chatbotId">;
}) {
  const documentObject = await prisma.document.create({
    data: document,
  });

  const chunks = splitTextIntoChunks(document.content, 2048, 256);

  console.log("chunks: ", chunks);

  const chunksWithEmbeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await embed({ input: chunk });

      await prisma.$executeRaw`
      INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
      VALUES (${uuidv4()}, ${embedding}::vector, ${documentObject.id}, ${
        document.chatbotId
      }, ${chunk})
      `;

      return {
        embedding: embedding as number[],
        chatbotId: document.chatbotId,
        content: chunk,
      };
    }),
  );

  console.log("embeddings: ", chunksWithEmbeddings);

  console.log(
    "printing out the created document from inside func: ",
    documentObject,
  );

  return documentObject;
}

// model Embedding {
//   id         String                      @id @default(uuid())
//   createdAt  DateTime                    @default(now())
//   updatedAt  DateTime                    @updatedAt
//   embedding  Unsupported("vector(1536)")
//   document   Document                    @relation(fields: [documentId], references: [id])
//   documentId String
//   chatbot    Chatbot                     @relation(fields: [chatbotId], references: [id])
//   chatbotId  String // so that we can find all embeddings for a chatbot easily
//   content    String
// }

// model Document {
//   id         String      @id @default(uuid())
//   createdAt  DateTime    @default(now())
//   updatedAt  DateTime    @updatedAt
//   name       String
//   embeddings Embedding[]
//   content    String
//   chatbot    Chatbot     @relation(fields: [chatbotId], references: [id])
//   chatbotId  String
// }

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

export async function processFiles({ files }: { files: FormDataEntryValue[] }) {
  const fileContents = await Promise.all(
    files.map(async (file) => {
      if (!(file instanceof File)) {
        throw new Error("Expected file");
      }

      const fileExtension = file.name.split(".").pop();
      let fileContent = "";

      switch (fileExtension) {
        case "txt":
        case "csv":
        case "html":
        case "json":
        case "md":
        case "mdx":
          fileContent = await file.text();
          break;
        case "pdf": {
          const fileBuffer = await file.arrayBuffer();
          const pdfParser = new PDFParser(this, 1);

          fileContent = await new Promise((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", reject);
            pdfParser.on("pdfParser_dataReady", (pdfData) => {
              resolve(pdfParser.getRawTextContent());
            });
            pdfParser.parseBuffer(new Buffer(fileBuffer));
          });
          break;
        }
        default:
          fileContent = "Unsupported file type";
          break;
      }

      return { name: file.name, content: fileContent };
    }),
  );

  return fileContents;
}
