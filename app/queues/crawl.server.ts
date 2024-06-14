import { Queue } from "~/utils/queue.server";
import { crawl } from "~/utils/scrape";

const MAX_CRAWLED_LINKS = 1000;

interface QueueData {
  url: string;
}

export const crawlQueue = Queue<QueueData>("crawl", async (job) => {
  return await crawl({
    url: job.data.url,
    maxCrawledLinks: MAX_CRAWLED_LINKS,
    inProgress: (progress) => {
      job.updateProgress(progress);
    },
  });
});
