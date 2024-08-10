import { Queue } from "~/utils/queue.server";
import { prisma } from "~/db.server";
import type { Prisma } from "@prisma/client";
import invariant from "tiny-invariant";

export type UpdateArticleQueueData = {
  articleId: string;
};

export const updateArticleQueue = Queue<UpdateArticleQueueData>(
  "updateArticle",
  async (job) => {
    invariant(
      job.data.articleId,
      "Article ID is required to update an article",
    );

    const childrenValues = await job.getChildrenValues();

    const data = Object.values(childrenValues)[0];

    // Type check and validation
    if (!isValidPartialArticle(data)) {
      throw new Error(
        `Invalid data format for article update: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      );
    }

    const updatedArticle = await prisma.article.update({
      where: { id: job.data.articleId },
      data,
    });

    return updatedArticle;
  },
);

// Function to check if the data is a valid partial Article
function isValidPartialArticle(
  data: unknown,
): data is Partial<Prisma.ArticleUpdateInput> {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const allowedKeys = Object.keys(prisma.article.fields).filter(
    (key) => !["id", "createdAt", "updatedAt"].includes(key),
  );

  return Object.keys(data).every((key) => allowedKeys.includes(key));
}
