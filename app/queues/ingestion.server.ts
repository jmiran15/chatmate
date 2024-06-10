import { Document, IngestionProgress } from "@prisma/client";
import { prisma } from "~/db.server";
import {
  embed,
  generatePossibleQuestionsForChunk,
  generateSummaryForChunk,
  splitStringIntoChunks,
} from "~/utils/llm/openai";
import { Queue } from "~/utils/queue.server";
import { v4 as uuid } from "uuid";
import invariant from "tiny-invariant";
import { updateDocument } from "~/models/document.server";

interface QueueData {
  documentId: Document["id"];
}

interface Chunk {
  id: string;
  documentId: string;
  content: string;
}

const CHUNK_SIZE = 1024;
const OVERLAP = 20;
const BATCH_SIZE = 10;

async function batchProcess<T>(
  array: T[],
  batchSize: number,
  asyncFunction: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize);
    batches.push(batch);
  }

  for (const batch of batches) {
    await Promise.all(batch.map((item, index) => asyncFunction(item, index)));
  }
}

async function embedChunk(chunk: Chunk & { chatbotId: Document["chatbotId"] }) {
  const summary: Chunk = await generateSummaryForChunk(chunk);
  const questions: Chunk[] = await generatePossibleQuestionsForChunk(chunk);

  await batchProcess(
    [chunk, summary, ...questions],
    BATCH_SIZE,
    async (node: Chunk) => {
      const embedding = await embed({ input: node.content });

      await prisma.$executeRaw`
            INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
            VALUES (${uuid()}, ${embedding}::vector, ${node.documentId}, ${
              chunk.chatbotId
            }, ${chunk.content})
            `;
    },
  );
}

export const queue = Queue<QueueData>("ingestion", async (job) => {
  console.log("ingestion.server.ts - started ingestion job id: ", job.id);

  invariant(
    job.id === job.data.documentId,
    "Job id and document id should be the same",
  );

  const document = await prisma.document.findUnique({
    where: {
      id: job.data.documentId,
    },
  });

  console.log(
    "ingestion.server.ts - started ingestion job for document: ",
    document?.id,
  );

  try {
    await prisma.$executeRaw`
      DELETE FROM "Embedding" WHERE "documentId" = ${document.id}
    `;

    const chunks: Chunk[] = splitStringIntoChunks(
      document,
      CHUNK_SIZE,
      OVERLAP,
    );

    await batchProcess(
      chunks.map((chunk) => ({ ...chunk, chatbotId: document.chatbotId })),
      BATCH_SIZE,
      embedChunk,
    );

    console.log(
      "ingestion.server.ts - finished ingestion job for document: ",
      document?.id,
    );
    console.log(
      "ingestion.server.ts - finished ingestion job for document: ",
      document?.id,
    );

    await updateDocument({
      id: document.id,
      data: {
        ingestionProgress: IngestionProgress.COMPLETE,
      },
    });
    await job.updateProgress(100);
  } catch (error) {
    console.error("ingestion.server.ts - error during ingestion job:", error);
    throw error; // Re-throw the error to mark the job as failed
  }
});
