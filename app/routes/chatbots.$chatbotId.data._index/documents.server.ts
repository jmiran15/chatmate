import { Document, DocumentType } from "@prisma/client";
import { serverOnly$ } from "vite-env-only/macros";
import { prisma } from "~/db.server";

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
    query: string | null,
    start: number,
    limit: number,
    filters: Filters,
    sort: {
      field: "createdAt" | "updatedAt";
      direction: "asc" | "desc";
    },
  ): Promise<{ items: Document[]; totalItems: number }> => {
    console.log("Search query", query);

    // const preprocessSearchTerms = (searchTerm: string) => {
    //   const tsquerySpecialChars = /[()|&:*!]/g;
    //   return searchTerm
    //     ?.trim()
    //     .replace(tsquerySpecialChars, " ")
    //     .split(/\s+/)
    //     .join(" & ");
    // };

    // console.log("search query", preprocessSearchTerms(query));

    const isPendingFilter = getIsPendingFilter(filters.progress);
    const whereClause = {
      chatbotId,
      ...(filters.type && filters.type.length > 0
        ? { type: { in: filters.type } }
        : {}),
      ...(isPendingFilter !== undefined ? { isPending: isPendingFilter } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    console.log("whereClause", whereClause);

    const [totalItems, items] = await prisma.$transaction([
      prisma.document.count({ where: whereClause }),
      prisma.document.findMany({
        where: whereClause,
        orderBy: [
          { [sort.field]: sort.direction },
          query
            ? {
                _relevance: {
                  fields: ["name", "content"],
                  search: query,
                  sort: "desc",
                },
              }
            : {},
        ],
        skip: start,
        take: limit,
      }),
    ]);

    return {
      items,
      totalItems,
    };
  },
);
