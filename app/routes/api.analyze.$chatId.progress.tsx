import type { Message } from "@prisma/client";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Job, QueueEventsListener } from "bullmq";
import { eventStream } from "remix-utils/sse/server";
import {
    analyzeChat,
    AnalyzeChatQueueData,
} from "~/queues/chat/answered/queue.server";
import { RegisteredQueue } from "~/utils/queue.server";

export interface AnalyzeProgressData {
  chatId: string;
  completed: boolean;
  returnvalue: Message | null;
  failedReason: string | null;
}

// we just want to send out and event when it completes

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { chatId } = params;

  if (
    !global.__registeredQueues ||
    !global.__registeredQueues[analyzeChat.name]
  ) {
    return json(
      { error: "Analyze chat queue is not registered" },
      { status: 500 },
    );
  }

  if (!chatId) {
    return json({ error: "Chat ID not provided" }, { status: 400 });
  }

  try {
    return eventStream(
      request.signal,
      function setup(send: (event: { event?: string; data: string }) => void) {
        const eventsToListenTo = ["failed", "completed"];

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

            if (!job || !isRelatedToChat(job, chatId!)) return;

            const isCompleted =
              event === "completed" || (await job.isCompleted());

            try {
              // Check if the request is still open before sending
              if (!request.signal.aborted) {
                send({
                  data: JSON.stringify({
                    chatId: job.data.chatId,
                    completed: isCompleted,
                    returnvalue: job.returnvalue,
                    failedReason: job.failedReason,
                  }),
                });
              }
            } catch (error) {
              console.error(`Error sending event: ${event}`, error);
            }
          };
        }

        const registeredQueue = global.__registeredQueues?.[analyzeChat.name];
        if (!registeredQueue) {
          console.error(`Registered queue not found for ${analyzeChat.name}`);
          return () => {};
        }
        eventsToListenTo.forEach(async (event) => {
          const listener = await createListener(event, registeredQueue);
          listeners[`${analyzeChat.name}-${event}`] = listener;
          registeredQueue?.queueEvents.on(
            event as keyof QueueEventsListener,
            listener,
          );
        });

        return function clear() {
          const registeredQueue = global.__registeredQueues?.[analyzeChat.name];
          if (!registeredQueue) {
            console.error(`Registered queue not found for ${analyzeChat.name}`);
            return () => {};
          }
          eventsToListenTo.forEach((event) => {
            registeredQueue?.queueEvents.removeListener(
              event as keyof QueueEventsListener,
              listeners[`${analyzeChat.name}-${event}`],
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

function isRelatedToChat(job: Job<AnalyzeChatQueueData>, chatId: string) {
  return job.data.chatId === chatId;
}
