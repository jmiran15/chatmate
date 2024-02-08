// this:
// 1. creates crawler
// 2. crawls the url and returns page[]
// 3. calls prepareDocuments which calls the splitter on them and returns them as Document[]
// 4. embed documents and upsert them

import { Document as DocumentTable } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";
export type { Chatbot } from "@prisma/client";
import { getEmbeddings } from "./openai";
import {
  Document,
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
} from "./splitter";

// import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
// import { chunkedUpsert } from "../../utils/chunkedUpsert";
import md5 from "md5"; // this is a hashing function
import { Crawler, Page } from "./crawler";
import { truncateStringByBytes } from "./truncateString";
import { createDocuments } from "~/models/document.server";

interface SeedOptions {
  splittingMethod: string;
  chunkSize: number;
  chunkOverlap: number;
}

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter;

// id will be something derived from the document content SINCE THE EMBEDDING WILL ALSO KNOW THIS
// async function createDocuments({
//   documents,
// }: {
//   documents: Pick<DocumentTable, "id" | "name" | "content" | "chatbotId">[];
// }) {
//   //   await prisma.document.createMany({
//   //     data: documents,
//   //   });
//   // upsert just incase we have duplicate content which would lead to duplicate ids
//   const requests = documents.map((item) =>
//     prisma.document.upsert({
//       where: { id: item.id },
//       update: {
//         name: item.name,
//         content: item.content,
//         chatbotId: item.chatbotId,
//       },
//       create: item,
//     }),
//   );

//   await prisma.$transaction(requests);
// }

async function createEmbeddings({
  embedding,
  documentId,
  chatbotId,
  content,
}: {
  embedding: number[];
  documentId: string;
  chatbotId: string;
  content: string;
}) {
  await prisma.$executeRaw`
    INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
    VALUES (${uuidv4()}, ${embedding}::vector, ${documentId}, ${chatbotId}, ${content})
    `;
}

async function seed(
  url: string,
  limit: number,
  options: SeedOptions,
  chatbotId: string,
) {
  try {
    // Destructure the options object
    const { splittingMethod, chunkSize, chunkOverlap } = options;

    // Create a new Crawler with depth 1 and maximum pages as limit
    const crawler = new Crawler(1, limit || 100);

    // Crawl the given URL and get the pages
    const pages = (await crawler.crawl(url)) as Page[];

    // map over the pages and add a hash to them
    // Map over the documents and add a hash to their metadata
    // const pagesForPrisma = pages.map((page: Page) => {
    //   return {
    //     name: page.url,
    //     content: page.content,
    //     id: md5(page.content),
    //     chatbotId,
    //   };
    // });

    // console.log("Pages for Prisma: ", pagesForPrisma);
    // return pagesForPrisma;

    // Create documents in the database
    // CALL PRISMA.CREATEMANY ON PAGES!
    // await createDocuments({
    //   documents: pagesForPrisma,
    // });

    // Choose the appropriate document splitter based on the splitting method
    // const splitter: DocumentSplitter =
    //   splittingMethod === "recursive"
    //     ? new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap }) // this is the one we have
    //     : new MarkdownTextSplitter({});

    // Prepare documents by splitting the pages
    // const documents = await Promise.all(
    //   pages.map((page) => prepareDocument(page, splitter)),
    // );

    // console.log("Documents: ", documents);

    // Get the vector embeddings for the documents
    // these vectors are specific to PINECONE

    // !!!!
    // Instead of storing Embedding and Document tables,
    // can just have Vector table, in the metadata we have the values
    // then we can add indeces to this table based on the metadata values
    // such as chatbotId, documentId, etc

    // NVM, keep the same tables. we need sperate tables so that we can show the user UNCHUNKED/SPLIT DOCUMENTS.
    // const vectors = await Promise.all(documents.flat().map(embedDocument));

    // CALL PRISMA.CREATEMANY ON VECTORS! (DOCUMENTS ARE JUST INTERMEDIARIES)

    // Promise.all the createEmbeddings function on the vectors

    // for each vector, call createEmbeddings
    // await Promise.all(
    //   vectors.map((vector) => {
    //     console.log("Vector: ", vector);
    //     return createEmbeddings({
    //       embedding: vector.values,
    //       documentId: vector.id,
    //       chatbotId,
    //       content: vector.metadata.chunk,
    //     });
    //   }),
    // );

    await createDocuments({
      documents: pages.map((page) => {
        return {
          name: page.url,
          content: page.content,
          chatbotId,
        };
      }),
    });

    // rename createDocuments to createVectors
    // this would be something like CREATE_DOCUMENTS, WHICH WOULD COME FROM DOCUMENTS.SERVER.TS
    // the new CREATE_DOCUMENTS function takes Vector types
  } catch (error) {
    console.error("Error seeding:", error);
    throw error;
  }
}

async function embedDocument(doc: Document) {
  try {
    // Generate OpenAI embeddings for the document content
    const embedding = await getEmbeddings({ input: doc.pageContent });

    // Create a hash of the document content
    const hash = md5(doc.pageContent);

    // Return the vector embedding object
    return {
      id: hash, // The ID of the vector is the hash of the document content
      values: embedding, // The vector values are the OpenAI embeddings
      metadata: {
        // The metadata includes details about the document
        chunk: doc.pageContent, // The chunk of text that the vector represents
        text: doc.metadata.text as string, // The text of the document
        url: doc.metadata.url as string, // The URL where the document was found
        hash: doc.metadata.hash as string, // The hash of the document content
      },
    };
  } catch (error) {
    console.log("Error embedding document: ", error);
    throw error;
  }
}

async function prepareDocument(
  page: Page,
  splitter: DocumentSplitter,
): Promise<Document[]> {
  // Get the content of the page
  const pageContent = page.content;

  // Split the documents using the provided splitter
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        url: page.url,
        // Truncate the text to a maximum byte length
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);

  // Map over the documents and add a hash to their metadata
  return docs.map((doc: Document) => {
    return {
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        // Create a hash of the document content
        hash: md5(doc.pageContent),
      },
    };
  });
}

export default seed;
