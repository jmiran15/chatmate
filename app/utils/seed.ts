// import { v4 as uuidv4 } from "uuid";

// import { prisma } from "~/db.server";
export type { Chatbot } from "@prisma/client";
// import { getEmbeddings } from "./openai";
// import {
//   // Document,
//   MarkdownTextSplitter,
//   RecursiveCharacterTextSplitter,
// } from "./splitter";

// import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
// import { chunkedUpsert } from "../../utils/chunkedUpsert";
// import md5 from "md5"; // this is a hashing function
import { Crawler, Page } from "./crawler";
// import { truncateStringByBytes } from "./truncateString";
import { createDocuments } from "~/models/document.server";

async function seed(url: string, limit: number, chatbotId: string) {
  try {
    // Create a new Crawler with depth 1 and maximum pages as limit
    const crawler = new Crawler(1, limit || 100);

    // Crawl the given URL and get the pages
    const pages = (await crawler.crawl(url)) as Page[];

    // 1. GET GOOD DATA
    // 2. IMPROVE DATA WITH FINE TUNED GPT-3 MODEL (I.E. TELL IT TO FORMAT THINGS AND GROUP THINGS TOGETHER)
    // WE HAVE A MARKDOWN SPLITTER THAT TRIES TO SPLIT ALONG MARKDOWN HEADERS (SHOULD BE DECENT ENOUGH)
    // NEED GOOD SPLITTER WITH GOOD CHUNK SIZE AND OVERLAP

    // WE WILL PASS THESE CHUNKS TO THE FINE TUNED MODEL WHICH WILL GENERATE A BUNCH OF POTENTIAL QUESTIONS FOR IT THAT A USER COULD ASK
    // THEN WE ARE GOING TO EMBED ALL THOSE QUESTIONS AND THE ORIGINAL CHUNK
    // EMBEDS WILL ALL POINT BACK TO THE ORIGINAL DOCUMENT.
    return await createDocuments({
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

export default seed;
