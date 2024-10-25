import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Job, QueueEventsListener } from "bullmq";
import { eventStream } from "remix-utils/sse/server";
import {
  QueueData as IngestionQueueData,
  queue as ingestionQueue,
} from "~/queues/ingestion/ingestion.server";
import { parseFileQueue } from "~/queues/parsefile.server";
import { qaqueue } from "~/queues/qaingestion/qaingestion.server";
import { ScrapeQueueData, scrapeQueue } from "~/queues/scrape.server";
import { RegisteredQueue } from "~/utils/queue.server";

export interface ProgressData {
  documentId: string;
  queueName: string;
  progress: number | object | null;
  completed: boolean;
  returnvalue: any | null;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { chatbotId } = params;

  if (
    !global.__registeredQueues ||
    !global.__registeredQueues[ingestionQueue.name] ||
    !global.__registeredQueues[qaqueue.name] ||
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
      function setup(send: (event: { event?: string; data: string }) => void) {
        const queues = [ingestionQueue, qaqueue, scrapeQueue, parseFileQueue];

        const eventsToListenTo = ["failed", "completed", "progress"];

        const listeners: { [key: string]: (args: any) => Promise<void> } = {};

        async function createListener(
          event: string,
          registeredQueue: RegisteredQueue,
        ) {
          console.log(
            "Creating listener for event: ",
            event,
            registeredQueue.queue.name,
          );
          return async function listener(args: any) {
            const job = await registeredQueue?.queue.getJob(args.jobId);
            // console.log("Job triggered event: ", JSON.stringify(job, null, 2));

            if (!job || !isRelatedToChatbot(job, chatbotId!)) return;

            const isCompleted =
              event === "completed" || (await job.isCompleted());

            try {
              // Check if the request is still open before sending
              if (!request.signal.aborted) {
                send({
                  data: JSON.stringify({
                    documentId: job.data.document.id,
                    queueName: registeredQueue.queue.name,
                    progress: job.progress,
                    completed: isCompleted,
                    returnvalue: job.returnvalue,
                    failedReason: job.failedReason,
                  }),
                });
              }

              // todo: check - once a single job is completed, we are removing that listener... from the queue events...
              // this means that when one jobs completes, no other complete events are listened to!!!
              // if (isCompleted) {
              //   console.log(
              //     `Completed ${registeredQueue.queue.name}: ${job.data.document.id}`,
              //   );
              //   // Remove listeners if the job is completed
              //   eventsToListenTo.forEach((evt) => {
              //     registeredQueue?.queueEvents.removeListener(
              //       evt as keyof QueueEventsListener,
              //       listeners[`${registeredQueue.queue.name}-${evt}`],
              //     );
              //   });
              // }
            } catch (error) {
              console.error(`Error sending event: ${event}`, error);
            }
          };
        }

        queues.forEach((queue) => {
          const registeredQueue = global.__registeredQueues?.[queue.name];
          if (!registeredQueue) {
            console.error(`Registered queue not found for ${queue.name}`);
            return;
          }
          eventsToListenTo.forEach(async (event) => {
            const listener = await createListener(event, registeredQueue);
            listeners[`${queue.name}-${event}`] = listener;
            registeredQueue?.queueEvents.on(
              event as keyof QueueEventsListener,
              listener,
            );
          });
        });

        // Initial check for completed jobs
        // queues.forEach(async (queue) => {
        //   const registeredQueue = global.__registeredQueues?.[queue.name];
        //   if (!registeredQueue) {
        //     console.error(`Registered queue not found for ${queue.name}`);
        //     return;
        //   }
        //   const jobs = await registeredQueue.queue.getJobs(["completed"]);

        //   console.log(`Found ${jobs.length} completed jobs on initial load`);
        //   jobs.forEach(async (job) => {
        //     if (isRelatedToChatbot(job, chatbotId)) {
        //       // Check if the request is still open before sending
        //       if (!request.signal.aborted) {
        //         send({
        //           data: JSON.stringify({
        //             documentId: job.data.document.id,
        //             queueName: registeredQueue.queue.name,
        //             progress: 100,
        //             completed: true,
        //             returnvalue: job.returnvalue,
        //           }),
        //         });
        //       }
        //     }
        //   });
        // });

        return function clear() {
          queues.forEach((queue) => {
            const registeredQueue = global.__registeredQueues?.[queue.name];
            if (!registeredQueue) {
              console.error(`Registered queue not found for ${queue.name}`);
              return;
            }
            eventsToListenTo.forEach((event) => {
              registeredQueue?.queueEvents.removeListener(
                event as keyof QueueEventsListener,
                listeners[`${queue.name}-${event}`],
              );
            });
          });
        };
      },
    );
  } catch (error) {
    console.error(`Error in eventStream:`, error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

function isRelatedToChatbot(
  job: Job<IngestionQueueData | ScrapeQueueData>,
  chatbotId: string,
) {
  return job.data.document.chatbotId === chatbotId;
}
