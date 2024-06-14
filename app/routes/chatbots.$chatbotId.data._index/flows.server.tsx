import { Document } from "@prisma/client";
import { FlowProducer } from "bullmq";
import { queue as scrapeQueue } from "~/queues/scrape.server";
import { queue as ingestionQueue } from "~/queues/ingestion.server";
import { redis } from "~/utils/redis.server";

// move this so it is a singleton
export const flow = new FlowProducer({
  connection: redis,
});

export async function webFlow({ documents }: { documents: Document[] }) {
  //   queue.add("scrape", { document: documents[0] });

  return await flow.addBulk(
    documents.map((document) => ({
      name: `ingestion-${document.id}`,
      queueName: ingestionQueue.name,
      data: { document },
      opts: {
        jobId: document.id,
      },
      children: [
        {
          name: `scrape`,
          queueName: scrapeQueue.name,
          data: { document },
        },
      ],
    })),
  );
}
