import { eventStream } from "remix-utils/sse/server";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  QueueData as IngestionQueueData,
  queue as ingestionQueue,
} from "~/queues/ingestion.server";
import { ScrapeQueueData, scrapeQueue } from "~/queues/scrape.server";
import { Job, QueueEventsListener } from "bullmq";
import { RegisteredQueue } from "~/utils/queue.server";
import { parseFileQueue } from "~/queues/parsefile.server";

export interface ProgressData {
  documentId: string;
  queueName: string;
  progress: number | object | null;
  completed: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  returnvalue: any | null;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { chatbotId } = params;

  // maybe make a single preprocessing queue that has a switch inside for getting the content - since the rest is the same?
  if (
    !global.__registeredQueues ||
    !global.__registeredQueues[ingestionQueue.name] ||
    !global.__registeredQueues[scrapeQueue.name] ||
    !global.__registeredQueues[parseFileQueue.name]
  ) {
    return json({ error: "Queues are not registered" }, { status: 500 });
  }

  if (!chatbotId) {
    return json({ error: "Chatbot ID not provided" }, { status: 400 });
  }

  try {
    return eventStream(
      request.signal,
      function setup(send: (event: { event: string; data: string }) => void) {
        console.log(`api.chatbot.$chatbotId.data.progress - setup`);

        async function listener(
          event: "failed" | "completed" | "progress",
          registeredQueue: RegisteredQueue,
          jobId: string,
        ) {
          //   console.log(`trying to send out an event: ${event}`);
          const job = await registeredQueue?.queue.getJob(jobId);
          if (!job || !isRelatedToChatbot(job, chatbotId)) return;

          // we should send better info

          try {
            send({
              event,
              data: JSON.stringify({
                documentId: job.data.document.id,
                queueName: registeredQueue.queue.name,
                progress: job.progress,
                completed: Boolean(await job.isCompleted()),
                returnvalue: job.returnvalue,
                failedReason: job.failedReason,
              }),
            });
          } catch (error) {
            console.log(`error sending event: ${error}`);
          }
        }

        // all the queues we listen to
        const queues = [ingestionQueue, scrapeQueue, parseFileQueue];
        const eventsToListenTo = ["failed", "completed", "progress"];
        queues.forEach((queue) => {
          const registeredQueue = global.__registeredQueues[queue.name];
          eventsToListenTo.forEach((event) => {
            registeredQueue?.queueEvents.on(
              event as keyof QueueEventsListener,
              (args) => listener(event, registeredQueue, args.jobId),
            );
          });
        });

        return function clear() {
          queues.forEach((queue) => {
            const registeredQueue = global.__registeredQueues[queue.name];
            eventsToListenTo.forEach((event) => {
              registeredQueue?.queueEvents.off(
                event as keyof QueueEventsListener,
                (args) => listener(event, registeredQueue, args.jobId),
              );
            });
          });
        };
      },
    );
  } catch (error) {
    console.log(`error: ${error}`);
  }
}

function isRelatedToChatbot(
  job: Job<IngestionQueueData | ScrapeQueueData>,
  chatbotId: string,
) {
  return job.data.document.chatbotId === chatbotId;
}
