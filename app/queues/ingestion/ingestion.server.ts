import { createId } from "@paralleldrive/cuid2";
import { Document, Prisma } from "@prisma/client";
import { Job } from "bullmq";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { updateDocument } from "~/models/document.server";
import { embed } from "~/utils/openai";
import { Queue } from "~/utils/queue.server";
import { augmentChunk } from "./augmentChunk.server";
import { generateChunkBasedQuestions } from "./possibleQuestions.server";

export interface QueueData {
  document: Document;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  chatbotId: string;
}

const CHUNK_SIZE = 1024;
const OVERLAP = 20;
const BATCH_SIZE = 100;

export const queue = Queue<QueueData>("ingestion", async (job) => {
  const children = await job.getChildrenValues();

  let document;
  if (Object.keys(children).length > 0) {
    document = Object.values(children)[0];
  } else {
    document = job.data.document;
  }

  invariant(document?.id === job.data.document.id, "Document ids should match");

  const sessionId = createId();

  try {
    let progress = 0;

    const [deleteResult, progressUpdateResult] = await Promise.allSettled([
      prisma.$executeRaw`DELETE FROM "Embedding" WHERE "documentId" = ${document.id}`,
      job.updateProgress(progress),
    ]);

    // Handle results and errors
    if (deleteResult.status === "rejected") {
      console.error(
        "Failed to delete existing embeddings:",
        deleteResult.reason,
      );
      throw new Error("Failed to delete existing embeddings");
    }

    const chunks: Chunk[] = splitStringIntoChunks(
      document,
      CHUNK_SIZE,
      OVERLAP,
    );

    const totalChunks = chunks.length;
    const progressPerChunk = 100 / totalChunks;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const settledResults = await Promise.allSettled(
        batch.map(async (chunk) => {
          const [augmentationResult, possibleQuestionsResult] =
            await Promise.allSettled([
              augmentChunk({ chunk, sessionId }),
              generateChunkBasedQuestions({ chunk, sessionId }),
            ]);

          return {
            chunk,
            augmentationResult,
            possibleQuestionsResult,
          };
        }),
      );

      const embeddingsToCreate: {
        chunkContent: string;
        content: string;
        documentId: string;
        chatbotId: string;
      }[] = [];

      for (const result of settledResults) {
        if (result.status === "fulfilled") {
          const { chunk, augmentationResult, possibleQuestionsResult } =
            result.value;

          embeddingsToCreate.push({
            content: chunk.content,
            chunkContent: chunk.content,
            documentId: chunk.documentId,
            chatbotId: chunk.chatbotId,
          });

          if (
            possibleQuestionsResult.status === "fulfilled" &&
            possibleQuestionsResult.value
          ) {
            const possibleQuestions = possibleQuestionsResult.value;
            embeddingsToCreate.push(
              ...possibleQuestions.generatedQuestions.map((q) => ({
                content: q,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              })),
              ...possibleQuestions.mainTopics.map((t) => ({
                content: t,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              })),
            );
          } else if (possibleQuestionsResult.status === "rejected") {
            console.error(
              "Failed to generate possible questions:",
              possibleQuestionsResult.reason,
            );
          }

          if (
            augmentationResult.status === "fulfilled" &&
            augmentationResult.value
          ) {
            const augmentation = augmentationResult.value;
            embeddingsToCreate.push(
              {
                content: augmentation.conciseSummary,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              },
              ...augmentation.keyPoints.map((point) => ({
                content: point,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              })),
              {
                content: augmentation.rephrasedVersion,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              },
              {
                content: augmentation.simplifiedVersion,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              },
              ...augmentation.keywords.map((keyword) => ({
                content: keyword,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              })),
              ...augmentation.semanticVariations.map((variation) => ({
                content: variation,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              })),
              ...augmentation.mainTopics.map((topic) => ({
                content: topic,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              })),
              ...augmentation.entities.map((entity) => ({
                content: entity,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              })),
              {
                content: augmentation.toneAndStyle,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              },
              {
                content: augmentation.contentType,
                chunkContent: chunk.content,
                documentId: chunk.documentId,
                chatbotId: chunk.chatbotId,
              },
            );
          } else if (augmentationResult.status === "rejected") {
            console.error(
              "Failed to augment chunk:",
              augmentationResult.reason,
            );
          }
        } else {
          console.error("Failed to process chunk:", result.reason);
        }
      }

      await batchProcessEmbeddings(
        embeddingsToCreate,
        document,
        job,
        progressPerChunk * batch.length,
        "/ingestion/embeddings",
        document.name || "Unnamed Document",
        sessionId,
      );

      progress += progressPerChunk * batch.length;
      await job.updateProgress(Math.min(progress, 100));
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
  } catch (error) {
    console.error("ingestion.server.ts - error during ingestion job:", error);
    throw error;
  }
});

async function batchProcessEmbeddings(
  embeddingsToCreate: {
    chunkContent: string;
    content: string;
    documentId: string;
    chatbotId: string;
  }[],
  document: Document,
  job: Job<QueueData>,
  progressIncrement: number,
  sessionPath: string,
  sessionName: string,
  sessionId: string,
) {
  const EMBEDDING_BATCH_SIZE = 100;
  let progress = 0;

  for (let i = 0; i < embeddingsToCreate.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = embeddingsToCreate.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchContents = batch.map((item) => item.content);

    const embeddings = await embed({
      input: batchContents,
      sessionId,
      sessionPath,
      sessionName,
    });

    await insertEmbeddingsBatch(batch, embeddings as number[][], document);

    progress += progressIncrement * (batch.length / embeddingsToCreate.length);
    await job.updateProgress(Math.min(progress, 100));
  }
}

async function insertEmbeddingsBatch(
  batch: {
    content: string;
    chunkContent: string;
    documentId: string;
    chatbotId: string;
  }[],
  embeddings: number[][],
  document: Document,
) {
  const values = batch.map((item, index) => ({
    id: createId(),
    embedding: embeddings[index],
    documentId: item.documentId,
    chatbotId: item.chatbotId,
    content: item.chunkContent,
  }));

  const sqlQuery = Prisma.sql`
    INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
    VALUES ${Prisma.join(
      values.map(
        (v) =>
          Prisma.sql`(${v.id}, ${v.embedding}::vector, ${v.documentId}, ${v.chatbotId}, ${v.content})`,
      ),
    )}
  `;

  await prisma.$executeRaw(sqlQuery);
}

// TODO: This will be done with Jina segmentation in the future
export function splitStringIntoChunks(
  document: Document,
  chunkSize: number,
  overlap: number,
): Chunk[] {
  invariant(document.content, "Document content is required");
  if (chunkSize <= 0) {
    throw new Error("Chunk size must be greater than 0.");
  }

  if (overlap >= chunkSize) {
    throw new Error("Overlap must be smaller than the chunk size.");
  }

  const chunks: Chunk[] = [];
  let startIndex = 0;

  while (startIndex < document.content.length) {
    const endIndex = Math.min(startIndex + chunkSize, document.content.length);
    const chunk = document.content.substring(startIndex, endIndex);
    const chunkId = createId();
    chunks.push({
      content: chunk,
      id: chunkId,
      documentId: document.id,
      chatbotId: document.chatbotId,
    });
    startIndex += chunkSize - overlap;

    // If the overlap is greater than the remaining characters, break to avoid an empty chunk
    if (startIndex + overlap >= document.content.length) {
      break;
    }
  }

  return chunks;
}
