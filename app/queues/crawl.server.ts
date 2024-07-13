import { WebCrawler } from "~/utils/crawler.server";
import { Queue } from "~/utils/queue.server";
import { createId } from "@paralleldrive/cuid2";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  currentDocumentUrl?: string;
}

export const crawlQueue = Queue<CrawlQueueData>("crawl", async (job) => {
  try {
    console.log("crawl.server.ts - initializing crawler");

    const isDev = process.env.NODE_ENV === "development";

    const crawler = isDev
      ? null
      : new WebCrawler({
          initialUrl: job.data.url,
          maxCrawledLinks: MAX_CRAWLED_LINKS,
        });

    const urls = isDev
      ? Array.from({ length: 100 }, (_, i) => `https://www.${createId()}.com`)
      : await crawler?.start(async (progress: CrawlQueueProgress) => {
          console.log("crawl.server.ts - inProgress", progress);
          await job.updateProgress(progress);
        });

    console.log("crawl.server.ts - urls", urls);

    return {
      urls,
    };
  } catch (error) {
    console.log("crawl.server.ts - error", error);
  }
});
