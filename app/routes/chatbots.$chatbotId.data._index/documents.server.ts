import { prisma } from "~/db.server";
import lunr from "lunr";
import { LRUCache } from "lru-cache";
import { searchCache } from "./route";

const indexCache = new LRUCache<string, lunr.Index>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

async function buildIndex(chatbotId: string): Promise<lunr.Index> {
  console.log(`Building search index for chatbot ${chatbotId}`);
  const documents = await prisma.document.findMany({
    where: { chatbotId },
    select: { id: true, name: true, content: true },
  });

  const idx = lunr(function () {
    this.ref("id");
    this.field("name", { boost: 10 });
    this.field("content");

    this.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);

    this.searchPipeline.add(lunr.stemmer);

    documents.forEach((doc) => {
      this.add({
        id: doc.id,
        name: doc.name,
        content: doc.content || "",
      });
    });
    console.log(`Indexed ${documents.length} documents`);
  });

  indexCache.set(chatbotId, idx);
  return idx;
}

async function getIndex(chatbotId: string): Promise<lunr.Index> {
  let index = indexCache.get(chatbotId);
  if (!index) {
    index = await buildIndex(chatbotId);
  }
  return index;
}

export async function searchDocuments(
  chatbotId: string,
  query: string,
  start: number,
  limit: number,
) {
  const index = await getIndex(chatbotId);

  // Prepare the query for wildcard search on both name and content
  const preparedQuery = query
    .split(" ")
    .map((term) => `name:${term}* content:${term}*`)
    .join(" OR ");

  console.log("Prepared query:", preparedQuery);

  const searchResults = index.search(preparedQuery);

  console.log("Search results:", searchResults);

  const totalItems = searchResults.length;
  const paginatedResults = searchResults.slice(start, start + limit);

  const items = await prisma.document.findMany({
    where: {
      id: { in: paginatedResults.map((result) => result.ref) },
      chatbotId,
    },
    orderBy: { createdAt: "desc" },
  });

  return { items, totalItems, searchResults: paginatedResults };
}

export async function getDocuments(
  chatbotId: string,
  start: number,
  limit: number,
) {
  const [totalItems, items] = await prisma.$transaction([
    prisma.document.count({ where: { chatbotId } }),
    prisma.document.findMany({
      where: { chatbotId },
      orderBy: { createdAt: "desc" },
      skip: start,
      take: limit,
    }),
  ]);

  return { items, totalItems };
}

export function invalidateIndex(chatbotId: string) {
  indexCache.delete(chatbotId);

  // Clear all entries in the searchCache that start with this chatbotId
  for (const key of searchCache.keys()) {
    if (key.startsWith(`${chatbotId}:`)) {
      searchCache.delete(key);
    }
  }

  console.log(`Cache invalidated for chatbot ${chatbotId}`);
}
