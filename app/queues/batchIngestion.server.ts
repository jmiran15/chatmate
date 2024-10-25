import { Document } from "@prisma/client";
import pLimit from "p-limit";
import { scrapeQueue } from "~/queues/scrape.server";
import { webFlow } from "~/routes/chatbots.$chatbotId.data._index/flows.server";
import { circuitBreaker } from "~/utils/circuitBreaker";
import { Queue } from "~/utils/queue.server";

const BATCH_SIZE = 50;
const CONCURRENCY_LIMIT = 3;

interface BatchIngestionData {
  documents: Document[];
  chatbotId: string;
}

export const batchIngestionQueue = Queue<BatchIngestionData>(
  "batchIngestion",
  async (job) => {
    const { documents, chatbotId } = job.data;
    const limit = pLimit(CONCURRENCY_LIMIT);
    const batches = chunkArray(documents, BATCH_SIZE);

    let processedCount = 0;
    const results = await Promise.allSettled(
      batches.map((batch) =>
        limit(async () => {
          try {
            const result = await circuitBreaker(
              `webFlow:${chatbotId}`,
              async () => {
                return await webFlow!({
                  documents: batch,
                  preprocessingQueue: scrapeQueue,
                });
              },
            );
            processedCount += batch.length;
            await job.updateProgress((processedCount / documents.length) * 100);
            return result;
          } catch (error) {
            console.error(`Batch processing failed: ${error}`);
            // Here you might want to implement retry logic
            throw error;
          }
        }),
      ),
    );

    // Process results
    const successfulResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);
    const failedResults = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason);

    // Log failures
    if (failedResults.length > 0) {
      console.error(`${failedResults.length} batches failed processing`);
      // Implement more detailed logging here
    }

    return {
      successful: successfulResults,
      failed: failedResults.length,
    };
  },
);

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
}
