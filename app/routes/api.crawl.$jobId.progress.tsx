import { eventStream } from "remix-utils/sse/server";
import { LoaderFunctionArgs } from "@remix-run/node";
import {
  crawlQueue,
  CrawlQueueReturn,
  CrawlQueueProgress,
} from "~/queues/crawl.server";

export interface Progress {
  progress: CrawlQueueProgress;
  completed: boolean;
  returnvalue: CrawlQueueReturn;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { jobId } = params;

  if (!jobId) {
    throw new Error("Job ID is required");
  }

  const registeredQueue = global.__registeredQueues[crawlQueue?.name];

  if (!registeredQueue) {
    throw new Error("Queue not found");
  }

  return eventStream(
    request.signal,
    function setup(send: (event: { event?: string; data: string }) => void) {
      async function listener(
        event: "failed" | "completed" | "progress",
        id: string,
      ) {
        if (id !== jobId) return;
        const job = await registeredQueue.queue.getJob(id);
        if (!job) return;
        try {
          send({
            // event,
            data: JSON.stringify({
              progress: job.progress,
              completed: Boolean(await job.isCompleted()),
              returnvalue: job.returnvalue,
              job,
            }),
          });
        } catch (error) {
          console.log(`error sending event: ${error}`);
        }
      }
      const eventsToListenTo = ["failed", "completed", "progress"];

      eventsToListenTo.forEach((event) => {
        registeredQueue?.queueEvents.on(event, (args) =>
          listener(event, args.jobId),
        );
      });

      return function clear() {
        eventsToListenTo.forEach((event) => {
          registeredQueue?.queueEvents.off(event, (args) =>
            listener(event, args.jobId),
          );
        });
      };
    },
  );
}
