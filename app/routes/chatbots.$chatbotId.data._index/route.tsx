import { Dialog, Transition } from "@headlessui/react";

import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
} from "@remix-run/react";
import { prisma } from "~/db.server";

import { useEffect, useState, useRef, Fragment } from "react";
import { AgGridReact } from "ag-grid-react";
import AgGridStyles from "ag-grid-community/styles/ag-grid.css";
import AgThemeAlpineStyles from "ag-grid-community/styles/ag-theme-alpine.css";

import { v4 as uuidv4 } from "uuid";

import DocumentCard from "~/components/document-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  createDocument,
  createDocuments,
  getDocumentsByChatbotId,
} from "~/models/document.server";
import {
  convertUploadedFilesToDocuments,
  generatePossibleQuestionsForChunk,
  generateSummaryForChunk,
  getEmbeddings,
  splitStringIntoChunks,
} from "~/utils/llm/openai";
import { getDocuments } from "~/utils/webscraper/scrape";
import {
  CHUNK_SIZE,
  Chunk,
  Document,
  FullDocument,
  OVERLAP,
} from "~/utils/types";
import { DialogDemo } from "./modal/modal";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbotId = params.chatbotId as string;

  if (!chatbotId) {
    return json({ error: "Chatbot id is required" }, { status: 400 });
  }

  const documents = await getDocumentsByChatbotId({ chatbotId });
  return json({ documents });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  switch (intent) {
    case "getLinks": {
      const url = String(formData.get("url"));

      // lets change this to a standalone pure function that gets the links and is optimized
      const links = await getDocuments([url], "crawl", 100, true);
      // these are the links we will show in the table
      return json({ intent, links });
    }

    case "crawlLinks": {
      let links = JSON.parse(formData.get("links") as string);
      links = links.map((link: Document) => link.metadata.sourceURL);

      const documents = await getDocuments(links, "single_urls", 100, false);

      // const documents: FullDocument[] = scrapedDocuments.map(
      //   (document: Document) => {
      //     const id = uuidv4();
      //     return {
      //       name: document.metadata.sourceURL
      //         ? document.metadata.sourceURL
      //         : "Untitled document",
      //       content: document.content,
      //       id,
      //     };
      //   },
      // );

      // // Create the documents in the database first
      // const createdDocuments = await prisma.document.createMany({
      //   data: documents.map((document) => ({
      //     name: document.name,
      //     content: document.content,
      //     chatbotId: chatbotId as string,
      //     id: document.id,
      //   })),
      // });

      // const baseChunks: Chunk[] = documents.flatMap((document) =>
      //   splitStringIntoChunks(document, CHUNK_SIZE, OVERLAP),
      // );

      // console.log("starting");
      // const BATCH_SIZE = 10;
      // const chunkedBaseChunks = [];
      // for (let i = 0; i < baseChunks.length; i += BATCH_SIZE) {
      //   chunkedBaseChunks.push(baseChunks.slice(i, i + BATCH_SIZE));
      // }

      // for (const batchChunks of chunkedBaseChunks) {
      //   console.log("Processing batch of chunks");
      //   await Promise.all(
      //     batchChunks.map(async (chunk, index) => {
      //       const [summary, questions] = await Promise.all([
      //         generateSummaryForChunk(chunk),
      //         generatePossibleQuestionsForChunk(chunk),
      //       ]);

      //       await Promise.all(
      //         [chunk, summary, ...questions].map(async (node) => {
      //           const embedding = await getEmbeddings({ input: node.content });
      //           await prisma.$executeRaw`
      //             INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
      //             VALUES (${uuidv4()}, ${embedding}::vector, ${
      //               node.documentId
      //             }, ${chatbotId}, ${chunk.content})
      //           `;

      //           console.log(
      //             `Inserted embedding for chunk ${index} out of ${baseChunks.length}`,
      //           );
      //           return {
      //             chunk: chunk.content,
      //             embedding: embedding,
      //             documentId: chunk.documentId,
      //             chatbotId,
      //           };
      //         }),
      //       );
      //     }),
      //   );
      // }

      // console.log("Inserted all embeddings");

      return json({ intent, documents });
    }

    // case "upload": {
    //   // do same parallel stuff that we do in the scrapeLinks action

    //   // Get all file entries from the original formData
    //   const files = formData.getAll("file");

    //   const fileContents: FullDocument[] =
    //     await convertUploadedFilesToDocuments(files);

    //   const baseChunks: Chunk[] = fileContents.flatMap((document) =>
    //     splitStringIntoChunks(document, CHUNK_SIZE, OVERLAP),
    //   );

    //   baseChunks.forEach(async (chunk) => {
    //     const summary = await generateSummaryForChunk(chunk);
    //     const questions = await generatePossibleQuestionsForChunk(chunk);

    //     await [chunk, summary, ...questions].map(async (node) => {
    //       const embedding = await getEmbeddings({ input: node.content });

    //       await prisma.$executeRaw`
    //       INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
    //       VALUES (${uuidv4()}, ${embedding}::vector, ${
    //         node.documentId
    //       }, ${chatbotId}, ${chunk.content})
    //       `;

    //       return {
    //         chunk: chunk.content,
    //         embedding: embedding,
    //         documentId: chunk.documentId,
    //         chatbotId,
    //       };
    //     });
    //   });

    //   // insert the document
    //   return await prisma.document.createMany({
    //     data: fileContents.map((document) => ({
    //       name: document.name,
    //       content: document.content,
    //       chatbotId: chatbotId as string,
    //       id: document.id,
    //     })),
    //   });
    // }
    case "createDocument": {
      const content = String(formData.get("content"));
      const name = String(formData.get("name"));
      const document = await createDocument({ name, content, chatbotId });

      // enqueue a ingestion job - bullmq

      return redirect(`/chatbots/${chatbotId}/data`);

      // return json({ intent, createdDocument: document });
    }
    case "createDocuments": {
      const documents = JSON.parse(String(formData.get("documents")));
      const createdDocuments = await createDocuments({ documents });

      // enqueue a batch of ingestion jobs - bullmq

      return redirect(`/chatbots/${chatbotId}/data`);
      // return json({ intent, createdDocuments });
    }

    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};

export default function Data() {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <DialogDemo />
      <div className="flex flex-col p-4 gap-8 w-full overflow-y-auto h-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">Data</h1>
          <h1 className="font-normal text-gray-700 dark:text-gray-400">
            This is the data that your chatbot will be able to reference in it's
            responses
          </h1>
        </div>

        {data.documents.length === 0 ? (
          <p className="p-4">No documents yet</p>
        ) : (
          <ol className="space-y-4 ">
            {data.documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  breadcrumb: "data",
};
