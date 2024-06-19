import { Document } from "@prisma/client";
import { FlowProducer, Queue } from "bullmq";
import { queue as ingestionQueue } from "~/queues/ingestion.server";
import { redis } from "~/utils/redis.server";

// move this so it is a singleton
export const flow = new FlowProducer({
  connection: redis,
});

export async function webFlow({
  documents,
  preprocessingQueue,
}: {
  documents: Document[];
  preprocessingQueue: Queue;
}) {
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
          name: `${preprocessingQueue.name}-${document.id}`,
          queueName: preprocessingQueue.name,
          data: { document },
        },
      ],
    })),
  );
}
