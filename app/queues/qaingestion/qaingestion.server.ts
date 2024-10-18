import { createId } from "@paralleldrive/cuid2";
import { Prisma, type Document } from "@prisma/client";
import { Job } from "bullmq";
import { prisma } from "~/db.server";
import { updateDocument } from "~/models/document.server";
import { embed } from "~/utils/openai";
import { Queue } from "~/utils/queue.server";
import { augmentDocument } from "../../utils/ai/augmentDocument.server";
import { generateSimilarQuestions } from "../../utils/ai/similarQuestions.server";

export interface QueueData {
  document: Document;
}

export const qaqueue = Queue<QueueData>("qaingestion", async (job) => {
  const document = job.data.document;
  const question = document.question;
  const answer = document.content;

  const sessionId = createId();

  if (!question || !answer) {
    return;
  }

  try {
    let progress = 0;

    const [
      deleteResult,
      progressUpdateResult,
      relevantQuestionsResult,
      augmentedAnswerResult,
      pendingUpdateResult,
    ] = await Promise.allSettled([
      prisma.$executeRaw`DELETE FROM "Embedding" WHERE "documentId" = ${document.id}`,
      job.updateProgress(progress),
      generateSimilarQuestions({
        baseAnswer: answer,
        baseQuestion: question,
        sessionId,
      }),
      augmentDocument({
        baseQuestion: question,
        baseAnswer: answer,
        sessionId,
      }),
      updateDocument({
        id: document.id,
        data: {
          isPending: true,
        },
      }),
    ]);

    // Handle results and errors
    if (deleteResult.status === "rejected") {
      console.error(
        "Failed to delete existing embeddings:",
        deleteResult.reason,
      );
      throw new Error("Failed to delete existing embeddings");
    }

    if (progressUpdateResult.status === "rejected") {
      console.error(
        "Failed to update initial progress:",
        progressUpdateResult.reason,
      );
      // Don't throw here, as this is not critical to the main operation
    }

    const relevantQuestions =
      relevantQuestionsResult.status === "fulfilled"
        ? relevantQuestionsResult.value
        : null;
    const augmentedAnswer =
      augmentedAnswerResult.status === "fulfilled"
        ? augmentedAnswerResult.value
        : null;

    // Log errors if any
    if (relevantQuestionsResult.status === "rejected") {
      console.error(
        "Failed to generate similar questions:",
        relevantQuestionsResult.reason,
      );
    }
    if (augmentedAnswerResult.status === "rejected") {
      console.error(
        "Failed to augment document:",
        augmentedAnswerResult.reason,
      );
    }

    const embeddingsToCreate: { content: string }[] = [
      { content: question },
      { content: answer },
    ];

    if (relevantQuestions) {
      embeddingsToCreate.push(
        ...relevantQuestions.generatedQuestions.map((q) => ({
          content: q.question,
        })),
      );
    }

    if (augmentedAnswer) {
      embeddingsToCreate.push(
        { content: augmentedAnswer.conciseSummary },
        { content: augmentedAnswer.rephrasedVersion },
        { content: augmentedAnswer.simplifiedVersion },
        { content: augmentedAnswer.expandedVersion },
        { content: augmentedAnswer.paragraphVersion },
        { content: augmentedAnswer.context },
        { content: augmentedAnswer.sourceType },
        { content: augmentedAnswer.temporalRelevance },
        ...augmentedAnswer.keyPoints.map((point) => ({
          content: point,
        })),
        ...augmentedAnswer.bulletPointVersion.map((point) => ({
          content: point,
        })),
        ...augmentedAnswer.keywords.map((keyword) => ({
          content: keyword,
        })),
        ...augmentedAnswer.potentialQuestions.map((q) => ({
          content: q,
        })),
        ...augmentedAnswer.semanticVariations.map((variation) => ({
          content: variation,
        })),
        ...augmentedAnswer.relatedConcepts.map((concept) => ({
          content: concept,
        })),
      );
    }

    const totalEmbeddings = embeddingsToCreate.length;
    const progressPerEmbedding = 100 / totalEmbeddings;

    await batchProcessEmbeddings(
      embeddingsToCreate,
      document,
      job,
      progressPerEmbedding,
      "/ingestion/embeddings",
      question,
      sessionId,
    );

    // Final progress update
    await prisma.document.update({
      where: { id: document.id },
      data: {
        isPending: false,
      },
    });

    await job.updateProgress(100);
  } catch (error) {
    console.error("qaingestion.server.ts - error during ingestion job:", error);
    throw error; // Re-throw the error to mark the job as failed
  }
});

async function batchProcessEmbeddings(
  embeddingsToCreate: { content: string }[],
  document: Document,
  job: Job<QueueData>,
  progressPerEmbedding: number,
  sessionPath: string,
  sessionName: string,
  sessionId: string,
) {
  const BATCH_SIZE = 100;
  let progress = 0;

  for (let i = 0; i < embeddingsToCreate.length; i += BATCH_SIZE) {
    const batch = embeddingsToCreate.slice(i, i + BATCH_SIZE);
    const batchContents = batch.map((item) => item.content);

    const embeddings = await embed({
      input: batchContents,
      sessionId,
      sessionPath,
      sessionName,
    });

    await insertEmbeddingsBatch(batch, embeddings as number[][], document);

    progress += progressPerEmbedding * batch.length;
    await job.updateProgress(Math.min(progress, 100));
  }
}

async function insertEmbeddingsBatch(
  batch: { content: string }[],
  embeddings: number[][],
  document: Document,
) {
  const values = batch.map((item, index) => ({
    id: createId(),
    embedding: embeddings[index],
    documentId: document.id,
    chatbotId: document.chatbotId,
    content: document.content, // This is what links the embedding back to the actual content that the user wrote
    // we should probably change the field name... 'content' should be what was embedded, and then for the actual raw content we want to link back to we should call it something like "retrievalContent" or something
    isQA: true,
  }));

  // Construct the SQL query
  const sqlQuery = Prisma.sql`
    INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content", "isQA")
    VALUES ${Prisma.join(
      values.map(
        (v) =>
          Prisma.sql`(${v.id}, ${v.embedding}::vector, ${v.documentId}, ${v.chatbotId}, ${v.content}, ${v.isQA})`,
      ),
    )}
  `;

  // Execute the raw query
  await prisma.$executeRaw(sqlQuery);
}
