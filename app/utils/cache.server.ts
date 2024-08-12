import { redis } from "./redis.server";

const CACHE_TTL = 60 * 60 * 24; // 24 hours

export async function getCachedScrapedContent(
  url: string,
): Promise<string | null> {
  return redis.get(`scraped:${url}`);
}

export async function setCachedScrapedContent(
  url: string,
  content: string,
): Promise<void> {
  await redis.set(`scraped:${url}`, content, "EX", CACHE_TTL);
}
