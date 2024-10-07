import { DocumentType } from "@prisma/client";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { requireUserId } from "~/session.server";
import { searchDocuments } from "./documents.server";
import { getStartLimit } from "./documentsList";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { chatbotId } = params;
  const userId = await requireUserId(request);

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
  });

  if (chatbot?.userId !== userId) {
    throw new Error("User does not have access to chatbot");
  }

  const url = new URL(request.url);
  const { start, limit } = getStartLimit(url.searchParams);
  const query = url.searchParams.get("q"); // TODO: implement search with regular Prisma query
  const types = url.searchParams.getAll("type");
  const progress = url.searchParams.getAll("progress");
  const sort = url.searchParams.get("sort") || "createdAt:desc";

  const [sortField, sortDirection] = sort.split(":");

  const filters = {
    type: types.length > 0 ? (types as DocumentType[]) : undefined,
    progress: progress.length > 0 ? progress : undefined,
  };

  const sortOption = {
    field: sortField as "createdAt" | "updatedAt",
    direction: sortDirection as "asc" | "desc",
  };

  try {
    const { items, totalItems } = await searchDocuments!(
      chatbotId,
      query,
      start,
      limit,
      filters,
      sortOption,
    );

    return json({ items, totalItems });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return json(
      {
        items: [],
        totalItems: 0,
        query,
        error: "An error occurred while fetching documents.",
      },
      { status: 500 },
    );
  }
};
