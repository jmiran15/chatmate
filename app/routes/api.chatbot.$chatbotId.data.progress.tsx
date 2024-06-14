import { eventStream } from "remix-utils/sse/server";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  QueueData as IngestionQueueData,
  queue as ingestionQueue,
} from "~/queues/ingestion.server";
import {
  QueueData as ScrapeQueueData,
  queue as scrapeQueue,
} from "~/queues/scrape.server";
import { Job, QueueEventsListener } from "bullmq";
import { RegisteredQueue } from "~/utils/queue.server";

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

  if (
    !global.__registeredQueues ||
    !global.__registeredQueues[ingestionQueue.name] ||
    !global.__registeredQueues[scrapeQueue.name]
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
        console.log(`eventStream - setup`);

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
            console.log(
              `job completion ${job.queueName}: ${await job.isCompleted()}`,
            );
            send({
              event,
              data: JSON.stringify({
                documentId: job.data.document.id,
                queueName: registeredQueue.queue.name,
                progress: job.progress,
                completed: Boolean(await job.isCompleted()),
                returnvalue: job.returnvalue,
              } as ProgressData),
            });
          } catch (error) {
            console.log(`error sending event: ${error}`);
          }
        }

        // all the queues we listen to
        const queues = [ingestionQueue, scrapeQueue];
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
            console.log(`clear - queue: ${queue.name}`);

            const registeredQueue = global.__registeredQueues[queue.name];
            eventsToListenTo.forEach((event) => {
              console.log(`clear - event: ${event}`);
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
