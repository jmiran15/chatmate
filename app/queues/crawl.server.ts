import { CACHE_DURATION } from "~/routes/chatbots.$chatbotId.data._index/action.server";
import { circuitBreaker } from "~/utils/circuitBreaker";
import { WebCrawler } from "~/utils/crawler.server";
import { Queue } from "~/utils/queue.server";
import { redis } from "~/utils/redis.server";

export const MAX_CRAWLED_LINKS = 100;
export const CONCURRENT_REQUESTS = 5;

export interface CrawlQueueData {
  url: string;
}

export interface CrawlQueueReturn {
  urls: string[];
}

export interface CrawlQueueProgress {
  current: number;
  total: number;
  status: string;
  metadata?: any;
  currentDocumentUrl?: string;
}

export const crawlQueue = Queue<CrawlQueueData>("crawl", async (job) => {
  try {
    const cachedResult = await redis.get(`crawl:${job.data.url}`);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    console.log("crawl.server.ts - initializing crawler");
    const crawler = new WebCrawler({
      initialUrl: job.data.url,
      maxCrawledLinks: MAX_CRAWLED_LINKS,
    });

    const urls = await circuitBreaker(`crawl:${job.data.url}`, async () => {
      return await crawler.start(async (progress: CrawlQueueProgress) => {
        console.log("crawl.server.ts - inProgress", progress);
        await job.updateProgress(progress);
      });
    });

    console.log("crawl.server.ts - urls", urls);

    const result = { urls };
    await redis.set(
      `crawl:${job.data.url}`,
      JSON.stringify(result),
      "EX",
      CACHE_DURATION,
    );

    return result;
  } catch (error) {
    console.log("crawl.server.ts - error", error);
    throw error;
  }
});
