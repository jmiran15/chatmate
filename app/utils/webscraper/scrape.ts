import { Progress, Document } from "../types";
import { scrapSingleUrl } from "./single-url";
// import { batchProcess } from "../../utils/batchProcess";
import { getLinksFromSitemap } from "./sitemap";
import { WebCrawler } from "./crawler";

// defaults
const CONCURRENT_REQUESTS = 20;
const MAX_CRAWLED_LINKS = 1000;
const RETURN_ONLY_URLS = false;

export async function convertUrlsToDocuments(
  urls: string[],
  inProgress?: (progress: Progress) => void,
  concurrentRequests: number = CONCURRENT_REQUESTS,
): Promise<Document[]> {
  const totalUrls = urls.length;
  let processedUrls = 0;
  const results: (Document | null)[] = new Array(urls.length).fill(null);
  for (let i = 0; i < urls.length; i += concurrentRequests) {
    const batchUrls = urls.slice(i, i + concurrentRequests);
    await Promise.all(
      batchUrls.map(async (url, index) => {
        const result = await scrapSingleUrl(url);
        processedUrls++;
        if (inProgress) {
          inProgress({
            current: processedUrls,
            total: totalUrls,
            status: "SCRAPING",
            currentDocumentUrl: url,
          });
        }
        results[i + index] = result;
      }),
    );
  }
  return results.filter((result) => result !== null) as Document[];
}

export async function getDocuments(
  urls: string[],
  mode: "single_urls" | "sitemap" | "crawl",
  maxCrawledLinks: number = MAX_CRAWLED_LINKS,
  returnOnlyUrls: boolean = RETURN_ONLY_URLS,
  inProgress?: (progress: Progress) => void,
): Promise<Document[] | []> {
  if (urls[0].trim() === "") {
    throw new Error("Url is required");
  }
  if (mode === "crawl") {
    const crawler = new WebCrawler({
      initialUrl: urls[0],
      maxCrawledLinks,
    });
    const links = await crawler.start(inProgress);
    if (returnOnlyUrls) {
      return links.map((url) => ({
        content: "",
        metadata: { sourceURL: url },
        provider: "web",
        type: "text",
      }));
    }
    return convertUrlsToDocuments(links, inProgress);
  }

  if (mode === "single_urls") {
    return convertUrlsToDocuments(urls, inProgress);
  }
  if (mode === "sitemap") {
    const links = await getLinksFromSitemap(urls[0]);
    console.log(`Found ${links.length} urls in sitemap`);
    return convertUrlsToDocuments(links, inProgress);
  }

  throw new Error("Method not implemented.");
}
