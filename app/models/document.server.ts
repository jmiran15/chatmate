import PDFParser from "pdf2json";

import { Chatbot, Document } from "@prisma/client";

import { prisma } from "~/db.server";
export type { Chatbot } from "@prisma/client";

// function to create multiple documents at once:
export function createDocuments({
  documents,
}: {
  documents: Pick<Document, "name" | "content" | "chatbotId">[];
}) {
  return prisma.document.createMany({
    data: documents,
  });
}

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
