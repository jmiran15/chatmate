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
    console.log(
      `[Scrape Queue] Starting job for document ${job.data.document.id}`,
    );
    invariant(job.data.document.url, "Document URL is required");

    if (!job.data.document.url) {
      console.warn(
        `[Scrape Queue] No URL provided for document ${job.data.document.id}`,
      );
      return job.data.document;
    }

    const cacheKey = `scrape:${job.data.document.url}`;
    const cachedResult = await redis.get(cacheKey);

    if (cachedResult) {
      console.log(`[Scrape Queue] Cache hit for URL: ${job.data.document.url}`);
      const scrapedContents = JSON.parse(cachedResult);
      return await prisma.document.update({
        where: { id: job.data.document.id },
        data: {
          content: scrapedContents.content,
        },
      });
    }

    console.log(
      `[Scrape Queue] Cache miss, scraping URL: ${job.data.document.url}`,
    );
    const scrapedContents = await circuitBreaker(cacheKey, () =>
      scrapSingleUrl(job.data.document.url!),
    );

    if (scrapedContents) {
      console.log(
        `[Scrape Queue] Successfully scraped URL: ${job.data.document.url}`,
      );
      await redis.set(
        cacheKey,
        JSON.stringify(scrapedContents),
        "EX",
        CACHE_DURATION,
      );
    } else {
      console.error(
        `[Scrape Queue] Failed to scrape URL: ${job.data.document.url}`,
      );
    }

    const updatedDocument = await prisma.document.update({
      where: { id: job.data.document.id },
      data: {
        content: scrapedContents?.content,
      },
    });

    console.log(
      `[Scrape Queue] Completed job for document ${job.data.document.id}`,
    );
    return updatedDocument;
  },
);
