import { DocumentType } from "@prisma/client";
import { LRUCache } from "lru-cache";
import lunr from "lunr";
import { serverOnly$ } from "vite-env-only/macros";
import { prisma } from "~/db.server";
import { searchCache } from "./route";

const indexCache = new LRUCache<string, lunr.Index>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

const buildIndex = serverOnly$(
  async (chatbotId: string): Promise<lunr.Index> => {
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
  },
);

const getIndex = serverOnly$(async (chatbotId: string): Promise<lunr.Index> => {
  let index = indexCache.get(chatbotId);
  if (!index) {
    index = await buildIndex(chatbotId);
  }
  return index;
});

type Filters = {
  type?: DocumentType[];
  progress?: string[];
};

function getIsPendingFilter(
  progress: string[] | undefined,
): boolean | undefined {
  if (!progress || progress.length === 0) return undefined;
  if (progress.includes("pending") && progress.includes("completed"))
    return undefined;
  if (progress.includes("pending")) return true;
  if (progress.includes("completed")) return false;
  return undefined;
}

export const searchDocuments = serverOnly$(
  async (
    chatbotId: string,
    query: string,
    start: number,
    limit: number,
    filters: Filters,
    sort: {
      field: "createdAt" | "updatedAt";
      direction: "asc" | "desc";
    },
  ) => {
    const index = await getIndex(chatbotId);

    const preparedQuery = query
      .split(" ")
      .map((term) => `name:${term}* content:${term}*`)
      .join(" OR ");

    console.log("Prepared query:", preparedQuery);

    const searchResults = index.search(preparedQuery);

    console.log("Search results:", searchResults);
    const paginatedResults = searchResults.slice(start, start + limit);

    const isPendingFilter = getIsPendingFilter(filters.progress);

    const whereClause = {
      id: { in: paginatedResults.map((result) => result.ref) },
      chatbotId,
      ...(filters.type && filters.type.length > 0
        ? { type: { in: filters.type } }
        : {}),
      ...(isPendingFilter !== undefined ? { isPending: isPendingFilter } : {}),
    };

    const [totalItems, items] = await prisma.$transaction([
      prisma.document.count({ where: whereClause }),
      prisma.document.findMany({
        where: whereClause,
        orderBy: { [sort.field]: sort.direction },
        skip: start,
        take: limit,
      }),
    ]);

    return {
      items,
      totalItems,
      searchResults: searchResults.slice(start, start + limit),
    };
  },
);

export const getDocuments = serverOnly$(
  async (
    chatbotId: string,
    start: number,
    limit: number,
    filters: Filters,
    sort: {
      field: "createdAt" | "updatedAt";
      direction: "asc" | "desc";
    },
  ) => {
    const isPendingFilter = getIsPendingFilter(filters.progress);

    const whereClause = {
      chatbotId,
      ...(filters.type && filters.type.length > 0
        ? { type: { in: filters.type } }
        : {}),
      ...(isPendingFilter !== undefined ? { isPending: isPendingFilter } : {}),
    };

    const [totalItems, items] = await prisma.$transaction([
      prisma.document.count({ where: whereClause }),
      prisma.document.findMany({
        where: whereClause,
        orderBy: { [sort.field]: sort.direction },
        skip: start,
        take: limit,
      }),
    ]);

    return { items, totalItems };
  },
);

export const invalidateIndex = serverOnly$((chatbotId: string) => {
  indexCache.delete(chatbotId);

  // Clear all entries in the searchCache that start with this chatbotId
  for (const key of searchCache.keys()) {
    if (key.startsWith(`${chatbotId}:`)) {
      searchCache.delete(key);
    }
  }

  console.log(`Cache invalidated for chatbot ${chatbotId}`);
});
