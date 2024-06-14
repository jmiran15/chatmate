import { Progress } from "./types";
import { WebCrawler } from "./crawler";

// defaults
export const CONCURRENT_REQUESTS = 5;
const MAX_CRAWLED_LINKS = 100;

export async function crawl({
  url,
  maxCrawledLinks = MAX_CRAWLED_LINKS,
  inProgress,
}: {
  url: string;
  maxCrawledLinks?: number;
  inProgress?: (progress: Progress) => void;
}) {
  const crawler = new WebCrawler({
    initialUrl: url,
    maxCrawledLinks,
  });

  return crawler.start(inProgress);
}
