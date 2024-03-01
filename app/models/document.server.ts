import { Chatbot, Document } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";
import { getEmbeddings } from "~/utils/openai";
export type { Chatbot } from "@prisma/client";

// takes full, non chuncked documents, inserts the full document as "Document", and also creates Embeddings from it (chunked)
// this function is WRONG, IT SHOULD HAVE NO SIDE EFFECTS
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

  await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await getEmbeddings({ input: chunk });

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

  return documentObject;
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

// export async function processFiles({ files }: { files: FormDataEntryValue[] }) {
//   const fileContents = await Promise.all(
//     files.map(async (file) => {
//       if (!(file instanceof File)) {
//         throw new Error("Expected file");
//       }

//       const fileExtension = file.name.split(".").pop();
//       let fileContent = "";

//       switch (fileExtension) {
//         case "txt":
//         case "csv":
//         case "html":
//         case "json":
//         case "md":
//         case "mdx":
//           fileContent = await file.text();
//           break;
//         case "pdf": {
//           const fileBuffer = await file.arrayBuffer();
//           const pdfParser = new PDFParser(this, 1);

//           fileContent = await new Promise((resolve, reject) => {
//             pdfParser.on("pdfParser_dataError", reject);
//             pdfParser.on("pdfParser_dataReady", () => {
//               resolve(pdfParser.getRawTextContent());
//             });
//             pdfParser.parseBuffer(new Buffer(fileBuffer));
//           });
//           break;
//         }
//         default:
//           fileContent = "Unsupported file type";
//           break;
//       }

//       return { name: file.name, content: fileContent };
//     }),
//   );

//   return fileContents;
// }

// delete a document by id
export const deleteDocumentById = async ({ id }: { id: Document["id"] }) => {
  return prisma.document.delete({ where: { id } });
};
