import { eventStream } from "remix-utils/sse/server";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import {
  crawlQueue,
  CrawlQueueReturn,
  CrawlQueueProgress,
} from "~/queues/crawl.server";

export interface Progress {
  progress: CrawlQueueProgress | null;
  completed: boolean;
  returnvalue: CrawlQueueReturn | null;
  jobId: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { jobId } = params;

  if (!jobId) {
    return json({ error: "Job ID not provided" }, { status: 400 });
  }

  if (
    !global.__registeredQueues ||
    !global.__registeredQueues[crawlQueue.name]
  ) {
    return json({ error: "Queues are not registered" }, { status: 500 });
  }

  const registeredQueue = global.__registeredQueues[crawlQueue?.name];

  const job = await registeredQueue.queue.getJob(jobId);
  if (!job) {
    return json({ error: "Job not found" }, { status: 404 });
  }

  try {
    return eventStream(
      request.signal,
      function setup(send: (event: { event?: string; data: string }) => void) {
        const eventsToListenTo = ["failed", "completed", "progress"];
        const listeners: { [key: string]: (args: any) => void } = {};

        // Initial check for job completion
        job.isCompleted().then((completed) => {
          if (completed) {
            send({
              data: JSON.stringify({
                progress: job.progress,
                completed,
                returnvalue: job.returnvalue,
                jobId: job.id,
              } as Progress),
            });
          }
        });

        function createListener(event: string) {
          return function listener(args: any) {
            if (args.jobId !== jobId) return;
            try {
              send({
                data: JSON.stringify({
                  progress: args.data ?? undefined,
                  returnvalue: args.returnvalue ?? undefined,
                  jobId: args.jobId ?? undefined,
                  completed: event === "completed",
                } as Progress),
              });

              if (event === "completed") {
                eventsToListenTo.forEach((evt) => {
                  registeredQueue?.queueEvents.removeListener(
                    evt,
                    listeners[evt],
                  );
                });
              }
            } catch (error) {
              console.error(`Error sending event: ${event}`, error);
            }
          };
        }

        eventsToListenTo.forEach((event) => {
          listeners[event] = createListener(event);
          registeredQueue?.queueEvents.on(event, listeners[event]);
        });

        return function clear() {
          eventsToListenTo.forEach((event) => {
            registeredQueue?.queueEvents.removeListener(
              event,
              listeners[event],
            );
          });
        };
      },
    );
  } catch (error) {
    console.error(`Error in eventStream:`, error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
