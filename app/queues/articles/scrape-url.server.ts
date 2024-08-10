import { Queue } from "~/utils/queue.server";
import axios from "axios";
import {
  getCachedScrapedContent,
  setCachedScrapedContent,
} from "~/utils/cache.server";
import { Job } from "bullmq";
import type { ScrapedWebsite } from "@prisma/client";

interface ScrapeJob {
  url: string;
}

async function handler(
  job: Job<ScrapeJob>,
): Promise<Partial<Omit<ScrapedWebsite, "id" | "createdAt" | "updatedAt">>> {
  const { url } = job.data;
  console.log(`\n🌐 Starting URL Scraping for: ${url}`);

  const cachedContent = await getCachedScrapedContent(url);
  if (cachedContent) {
    console.log(`📦 Using cached content for: ${url}`);
    console.log(
      `   📊 Cached content length: ${cachedContent.length} characters`,
    );
    return { url, content: cachedContent };
  }

  const jinaApiKey = process.env.JINA_API_KEY;
  if (!jinaApiKey) {
    console.error(`❌ JINA_API_KEY is not defined in environment variables`);
    throw new Error("JINA_API_KEY is not defined in environment variables");
  }

  console.log(`🔑 JINA API Key found, proceeding with scraping`);
  const jinaUrl = `https://r.jina.ai/${url}`;
  const headers = {
    Authorization: `Bearer ${jinaApiKey}`,
    "X-Return-Format": "markdown",
  };

  try {
    console.log(`🔄 Sending request to JINA API...`);
    const response = await axios.get(jinaUrl, { headers });
    console.log(`✅ Scraping successful for: ${url}`);
    console.log(
      `   📊 Scraped content length: ${response.data.length} characters`,
    );

    console.log(`🔄 Caching scraped content...`);
    await setCachedScrapedContent(url, response.data);
    console.log(`✅ Content cached successfully`);

    return { url, content: response.data };
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`);
    console.error(error);
    if (error instanceof Error) {
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    } else {
      throw new Error(`Failed to scrape ${url}: Unknown error`);
    }
  }
}

export const scrapeJinaQueue = Queue<ScrapeJob>("scrapeJina", handler);
