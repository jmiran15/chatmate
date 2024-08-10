import { eventStream } from "remix-utils/sse/server";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { flowProducer } from "~/flows/article-generation.server";
import { updateArticleQueue } from "~/queues/articles/update-article-from-child.server";

import { screenshotQueue } from "~/queues/articles/screenshot.server";
import { extractRelevantLinksQueue } from "~/queues/articles/extract-relevant-links.server";
import { extractProductInfoQueue } from "~/queues/articles/extract-product-info.server";
import { generateArticleQueue } from "~/queues/articles/generate-article.server";
import { appendScrapedWebsiteToProductQueue } from "~/queues/articles/db/product/append-scraped-website-to-product";
import { addChildScrapesQueue } from "~/queues/articles/addChildScrapes.server";
import { updateProductFromChildrenQueue } from "~/queues/articles/db/product/update-product-from-child.server";
import { scrapeJinaQueue } from "~/queues/articles/scrape-url.server";
import { JobNode } from "bullmq";

export interface JobProgress {
  jobId: string;
  status: "pending" | "active" | "completed" | "failed";
  data?: any;
  children?: JobProgress[];
}

const allQueues = [
  updateArticleQueue,
  screenshotQueue,
  extractRelevantLinksQueue,
  extractProductInfoQueue,
  generateArticleQueue,
  appendScrapedWebsiteToProductQueue,
  addChildScrapesQueue,
  updateProductFromChildrenQueue,
  scrapeJinaQueue,
];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { articleId } = params;

  if (!articleId) {
    return json({ error: "Article ID not provided" }, { status: 400 });
  }

  const flow = await flowProducer.getFlow({
    id: `update-article-${articleId}`,
    queueName: updateArticleQueue.name,
  });

  if (!flow) {
    return json({ error: "Flow not found" }, { status: 404 });
  }

  console.log(`🌊 Retrieved flow:`, JSON.stringify(flow, null, 2));

  // Check if all queues are registered
  if (!global.__registeredQueues) {
    return json({ error: "Queues are not registered" }, { status: 500 });
  }

  for (const queue of allQueues) {
    if (!global.__registeredQueues[queue.name]) {
      console.error(`❌ Queue ${queue.name} is not registered`);
      return json(
        { error: `Queue ${queue.name} is not registered` },
        { status: 500 },
      );
    }
  }

  console.log("✅ All queues are registered");

  const queueEvents = allQueues.reduce(
    (acc, queue) => {
      acc[queue.name] = global.__registeredQueues?.[queue.name]?.queueEvents;
      return acc;
    },
    {} as Record<string, any>,
  );

  try {
    return eventStream(
      request.signal,
      function setup(send: (event: { event?: string; data: string }) => void) {
        const eventsToListenTo = ["completed", "failed", "active", "progress"];
        const listeners: {
          [queueName: string]: { [event: string]: (args: any) => void };
        } = {};

        async function sendJobProgress() {
          // Check if the request is still open before sending
          if (!request.signal.aborted) {
            const jobProgress = await getJobProgress(flow);
            send({
              data: JSON.stringify(jobProgress),
            });
            console.log(`📊 Sent job progress for job ${flow.job.id}`);
          } else {
            console.log(
              `⚠️ Request aborted, skipping job progress send for job ${flow.job.id}`,
            );
          }
        }

        // Initial progress update
        sendJobProgress();

        async function createListener(queueName: string, event: string) {
          return async function listener(args: any) {
            console.log(
              `🎧 Received ${event} event for queue ${queueName}, jobId: ${args.jobId}`,
            );
            console.log(`🌊 Current flow job id: ${flow.job.id}`);
            console.log(
              `🌊 Flow structure:`,
              JSON.stringify(flow.job, null, 2),
            );

            // // Check if the job is part of the flow or its descendants
            const isPartOfFlow = await isJobPartOfFlow(flow, args.jobId);

            if (!isPartOfFlow) {
              console.log(
                `⏭️ Skipping event for jobId ${args.jobId} as it's not part of the current flow or its descendants`,
              );
              return;
            }

            console.log(`✅ Processing event for jobId ${args.jobId}`);

            // Check if the request is still open before sending progress
            if (!request.signal.aborted) {
              await sendJobProgress();
            } else {
              console.log(
                `⚠️ Request aborted, skipping progress send for job ${args.jobId}`,
              );
            }

            if (event === "completed" && args.jobId === flow.job.id) {
              console.log(
                `🏁 Main job ${flow.job.id} completed, removing all listeners`,
              );
              removeAllListeners();
            }
          };
        }

        async function isJobPartOfFlow(
          node: JobNode,
          targetJobId: string,
        ): Promise<boolean> {
          console.log(
            `🔍 Checking if job ${targetJobId} is part of flow with job ${node.job.id}`,
          );

          if (node.job.id === targetJobId) {
            console.log(`✅ Match found: ${node.job.id} === ${targetJobId}`);
            return true;
          }

          if (node.children && node.children.length > 0) {
            console.log(
              `👶 Checking ${node.children.length} children of job ${node.job.id}`,
            );
            for (const childNode of node.children) {
              if (await isJobPartOfFlow(childNode, targetJobId)) {
                return true;
              }
            }
          } else {
            console.log(`🚫 No children found for job ${node.job.id}`);
          }

          console.log(
            `❌ Job ${targetJobId} not found in flow with job ${node.job.id}`,
          );
          return false;
        }

        function removeAllListeners() {
          for (const queue of allQueues) {
            for (const event of eventsToListenTo) {
              if (listeners[queue.name] && listeners[queue.name][event]) {
                queueEvents[queue.name].removeListener(
                  event,
                  listeners[queue.name][event],
                );
                console.log(
                  `➖ Removed ${event} listener for queue ${queue.name}`,
                );
              }
            }
          }
        }

        allQueues.forEach((queue) => {
          listeners[queue.name] = {};
          eventsToListenTo.forEach(async (event) => {
            const listener = await createListener(queue.name, event);
            listeners[queue.name][event] = listener;
            queueEvents[queue.name].on(event, listener);
            console.log(`➕ Added ${event} listener for queue ${queue.name}`);
          });
        });

        return function clear() {
          removeAllListeners();
        };
      },
    );
  } catch (error) {
    console.error(`❌ Error in eventStream:`, error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getJobProgress(node: JobNode): Promise<JobProgress> {
  const jobState = await node.job.getState();
  const jobProgress: JobProgress = {
    jobId: node.job.id,
    status: jobState,
  };

  if (node.job.data) {
    jobProgress.data = node.job.data;
  }

  if (node.children && node.children.length > 0) {
    jobProgress.children = await Promise.all(
      node.children.map((childNode: JobNode) => getJobProgress(childNode)),
    );
  }

  console.log(
    `📊 Job progress for ${node.job.id}:`,
    JSON.stringify(jobProgress, null, 2),
  );
  return jobProgress;
}
