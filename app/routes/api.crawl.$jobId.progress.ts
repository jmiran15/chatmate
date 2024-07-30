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
  console.log("params", params);
  const { jobId } = params;

  if (!jobId) {
    return null;
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
    return null;
  }
  try {
    return eventStream(
      request.signal,
      function setup(send: (event: { event?: string; data: string }) => void) {
        const eventsToListenTo = ["failed", "completed", "progress"];

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
            return null;
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async function listener(args: any) {
          if (args.jobId !== jobId) return null;
          try {
            send({
              // event,
              data: JSON.stringify({
                progress: args.data ?? undefined,
                returnvalue: args.returnvalue ?? undefined,
                jobId: args.jobId ?? undefined,
              } as Progress),
            });

            if (args.returnvalue) {
              eventsToListenTo.forEach((event) => {
                registeredQueue?.queueEvents.off(event, (args) =>
                  listener(args),
                );
              });
              return null;
            }
          } catch (error) {
            console.log(`error sending event: ${error}`);
          }
        }

        eventsToListenTo.forEach((event) => {
          registeredQueue?.queueEvents.on(event, (args) => listener(args));
        });

        return function clear() {
          eventsToListenTo.forEach((event) => {
            registeredQueue?.queueEvents.off(event, (args) => listener(args));
          });
        };
      },
    );
  } catch (error) {
    console.log(`error sending event: ${error}`);
  }
}
