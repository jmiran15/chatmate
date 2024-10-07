import { Document } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { Queue } from "~/utils/queue.server";
import { scrapSingleUrl } from "~/utils/single-url";

export interface ScrapeQueueData {
  document: Document;
}

export const scrapeQueue = Queue<ScrapeQueueData>(
  "scrape",
  async (job): Promise<Document> => {
    invariant(job.data.document.url, "Document URL is required");
    const scrapedContents = await scrapSingleUrl(job.data.document.url);
    const updatedDocument = await prisma.document.update({
      where: { id: job.data.document.id },
      data: {
        content: scrapedContents?.content, // metadata ...
      },
    });

    return updatedDocument;
  },
);
