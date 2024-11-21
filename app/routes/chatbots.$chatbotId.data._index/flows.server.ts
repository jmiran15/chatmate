import { Document } from "@prisma/client";
import { FlowProducer, Queue } from "bullmq";
import { serverOnly$ } from "vite-env-only/macros";
import { queue as ingestionQueue } from "~/queues/ingestion/ingestion.server";
import { redis } from "~/utils/redis.server";

// move this so it is a singleton
const flow = new FlowProducer({
  connection: redis,
});

export const webFlow = serverOnly$(
  async ({
    documents,
    preprocessingQueue,
  }: {
    documents: Document[];
    preprocessingQueue: Queue;
  }) => {
    console.log("webFlow - called");
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
  },
);
