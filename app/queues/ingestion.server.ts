import { Document } from "@prisma/client";
import { prisma } from "~/db.server";
import {
  embed,
  generatePossibleQuestionsForChunk,
  generateSummaryForChunk,
  splitStringIntoChunks,
} from "~/utils/openai";
import { Queue } from "~/utils/queue.server";
import { v4 as uuid } from "uuid";
import invariant from "tiny-invariant";
import { updateDocument } from "~/models/document.server";
import { invalidateIndex } from "~/routes/chatbots.$chatbotId.data._index/documents.server";

export interface QueueData {
  document: Document;
}

interface Chunk {
  id: string;
  documentId: string;
  content: string;
}

const CHUNK_SIZE = 1024;
const OVERLAP = 20;
const BATCH_SIZE = 10;

export const queue = Queue<QueueData>("ingestion", async (job) => {
  const children = await job.getChildrenValues();

  let document;
  if (Object.keys(children).length > 0) {
    document = Object.values(children)[0];
  } else {
    document = job.data.document;
  }

  invariant(document?.id === job.data.document.id, "Document ids should match");

  try {
    let progress = 0;

    await prisma.$executeRaw`
      DELETE FROM "Embedding" WHERE "documentId" = ${document.id}
    `;

    await job.updateProgress(progress);

    const raw: Chunk[] = splitStringIntoChunks(document, CHUNK_SIZE, OVERLAP);

    const chunks = raw.map((chunk) => ({
      ...chunk,
      chatbotId: document.chatbotId,
    }));

    const chunkBatches = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      chunkBatches.push(batch);
    }

    const totalChunks = raw.length;
    const stepsPerChunk = 100 / totalChunks;
    console.log(`ingestion.server.ts - total chunks: ${totalChunks}`);
    console.log(`ingestion.server.ts - current progress: ${progress}`);
    console.log(`ingestion.server.ts - steps per chunk: ${stepsPerChunk}`);

    for (const batch of chunkBatches) {
      await Promise.all(
        batch.map(async (chunk) => {
          const summary: Chunk = await generateSummaryForChunk(chunk);
          const questions: Chunk[] =
            await generatePossibleQuestionsForChunk(chunk);

          const totalSubChunks = 2 + questions.length;
          const add = stepsPerChunk / totalSubChunks;

          const chunks = [chunk, summary, ...questions];
          const embeddingChunks = [];
          for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            embeddingChunks.push(batch);
          }

          for (const batch of embeddingChunks) {
            await Promise.all(
              batch.map(async (node: Chunk) => {
                const embedding = await embed({ input: node.content });

                await prisma.$executeRaw`
                    INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
                    VALUES (${uuid()}, ${embedding}::vector, ${
                      node.documentId
                    }, ${chunk.chatbotId}, ${chunk.content})
                    `;
                progress += add;
              }),
            );
            await job.updateProgress(progress);
          }
        }),
      );
    }

    console.log(`ingestion.server.ts - current progress: ${progress}`);

    console.log(
      "ingestion.server.ts - finished ingestion job for document: ",
      document?.id,
    );

    await updateDocument({
      id: document.id,
      data: {
        isPending: false,
      },
    });

    // Invalidate the index after updating the document
    invalidateIndex(document.chatbotId);
  } catch (error) {
    console.error("ingestion.server.ts - error during ingestion job:", error);
    throw error; // Re-throw the error to mark the job as failed
  }
});
