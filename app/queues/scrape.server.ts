import { Document } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { CACHE_DURATION } from "~/routes/chatbots.$chatbotId.data._index/action.server";
import { circuitBreaker } from "~/utils/circuitBreaker";
import { Queue } from "~/utils/queue.server";
import { redis } from "~/utils/redis.server";
import { scrapSingleUrl } from "~/utils/single-url";

export interface ScrapeQueueData {
  document: Document;
}

export const scrapeQueue = Queue<ScrapeQueueData>(
  "scrape",
  async (job): Promise<Document> => {
    invariant(job.data.document.url, "Document URL is required");

    if (!job.data.document.url) {
      return job.data.document;
    }

    const cachedResult = await redis.get(`scrape:${job.data.document.url}`);
    if (cachedResult) {
      const scrapedContents = JSON.parse(cachedResult);
      return await prisma.document.update({
        where: { id: job.data.document.id },
        data: {
          content: scrapedContents.content,
        },
      });
    }

    const scrapedContents = await circuitBreaker(
      `scrape:${job.data.document.url}`,
      () => scrapSingleUrl(job.data.document.url!),
    );

    if (scrapedContents) {
      await redis.set(
        `scrape:${job.data.document.url}`,
        JSON.stringify(scrapedContents),
        "EX",
        CACHE_DURATION,
      );
    }

    const updatedDocument = await prisma.document.update({
      where: { id: job.data.document.id },
      data: {
        content: scrapedContents?.content, // metadata ...
      },
    });

    return updatedDocument;
  },
);
