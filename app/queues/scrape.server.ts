import { Document } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { Queue } from "~/utils/queue.server";
import { scrapSingleUrl } from "~/utils/single-url";

export interface QueueData {
  document: Document;
}

export const queue = Queue<QueueData>("scrape", async (job) => {
  console.log("scrape.server.ts - starting scrape job");
  invariant(job.data.document.url, "Document URL is required");
  const scrapedContents = await scrapSingleUrl(job.data.document.url);

  const updatedDocument = await prisma.document.update({
    where: { id: job.data.document.id },
    data: {
      content: scrapedContents?.content, // metadata ...
    },
  });

  return updatedDocument;
});
