export async function getCrawlId({ baseUrl }: { baseUrl: string }) {
  // call firecrawl, make the job with initial status in db, return crawl id
}

// we call this for polling
export async function getCrawlStatus({ crawlId }: { crawlId: string }) {
  // call firecrawl, update db, return status
}

export async function scrapeUrl({ url }: { url: string }) {
  // call firecrawl, return the scraped url
}
