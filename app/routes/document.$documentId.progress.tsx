import { eventStream } from "remix-utils/sse/server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { Document, DocumentType } from "@prisma/client";
import {
  QueueData as IngestionQueueData,
  queue as ingestionQueue,
} from "~/queues/ingestion.server";
import { scrapeQueue, ScrapeQueueData } from "~/queues/scrape.server";

import { Job } from "bullmq";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { documentId } = params;

  if (
    !global.__registeredQueues ||
    !global.__registeredQueues[ingestionQueue.name] ||
    !global.__registeredQueues[scrapeQueue.name]
  ) {
    throw new Error("Queues not registered");
  }

  if (!documentId) {
    throw new Error("Document ID not provided");
  }

  // time this -
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.isPending) {
    return null;
  }

  const documentType = document.type;

  let preprocessingRegisteredQueue;
  switch (documentType) {
    case DocumentType.WEBSITE:
      preprocessingRegisteredQueue =
        global.__registeredQueues[scrapeQueue.name];
      break;
    // case DocumentType.FILE:
    //   preprocessingRegisteredQueue =
    //     global.__registeredQueues[parseFileQueue.name];
    //   break;
    default:
      preprocessingRegisteredQueue = undefined;
  }

  const ingestionRegisteredQueue =
    global.__registeredQueues[ingestionQueue.name];

  if (
    (!preprocessingRegisteredQueue && document.type !== DocumentType.RAW) ||
    !ingestionRegisteredQueue
  ) {
    throw new Error("Preprocessing or ingestion queue not found");
  }

  try {
    return eventStream(
      request.signal,
      function setup(send: (event: { event: string; data: string }) => void) {
        // This event is triggered when a job enters the 'active' state.

        async function onFailedPreprocessing({
          jobId,
          failedReason,
        }: {
          jobId: string;
          failedReason: string;
        }) {
          const job = await preprocessingRegisteredQueue?.queue.getJob(jobId);
          if (!job || !isRelatedToDocument(job, document)) return;
          send({
            event: "preprocessing-failed",
            data: JSON.stringify({ job, failedReason }),
          });
        }

        async function onCompletedPreprocessing({ jobId }: { jobId: string }) {
          const job = await preprocessingRegisteredQueue?.queue.getJob(jobId);
          if (!job || !isRelatedToDocument(job, document)) return;
          send({ event: "preprocessing-completed", data: JSON.stringify(job) });
        }

        async function onFailedIngestion({
          jobId,
          failedReason,
        }: {
          jobId: string;
          failedReason: string;
        }) {
          const job = await ingestionRegisteredQueue?.queue.getJob(jobId);
          if (!job || !isRelatedToDocument(job, document)) return;
          send({
            event: "ingestion-failed",
            data: JSON.stringify({ job, failedReason }),
          });
        }

        async function onCompletedIngestion({ jobId }: { jobId: string }) {
          const job = await ingestionRegisteredQueue?.queue.getJob(jobId);
          if (!job || !isRelatedToDocument(job, document)) return;
          send({ event: "ingestion-completed", data: JSON.stringify(job) });
        }

        async function onProgressIngestion({
          jobId,
          data,
        }: {
          jobId: string;
          data: number | object;
        }) {
          const job = await ingestionRegisteredQueue.queue.getJob(jobId);
          if (!job || !isRelatedToDocument(job, document)) return;
          send({ event: "ingestion-progress", data: JSON.stringify(data) });
        }

        preprocessingRegisteredQueue?.queueEvents.on(
          "completed",
          onCompletedPreprocessing,
        );
        preprocessingRegisteredQueue?.queueEvents.on(
          "failed",
          onFailedPreprocessing,
        );

        ingestionRegisteredQueue?.queueEvents.on(
          "completed",
          onCompletedIngestion,
        );
        ingestionRegisteredQueue?.queueEvents.on("failed", onFailedIngestion);
        ingestionRegisteredQueue?.queueEvents.on(
          "progress",
          onProgressIngestion,
        );

        return function clear() {
          preprocessingRegisteredQueue?.queueEvents.removeListener(
            "completed",
            onCompletedPreprocessing,
          );
          preprocessingRegisteredQueue?.queueEvents.removeListener(
            "failed",
            onFailedPreprocessing,
          );
          ingestionRegisteredQueue?.queueEvents.removeListener(
            "completed",
            onCompletedIngestion,
          );
          ingestionRegisteredQueue?.queueEvents.removeListener(
            "failed",
            onFailedIngestion,
          );
          ingestionRegisteredQueue?.queueEvents.removeListener(
            "progress",
            onProgressIngestion,
          );
        };
      },
    );
  } catch (error) {
    throw new Error("Error during loader");
  }
}

function isRelatedToDocument(
  job: Job<IngestionQueueData | ScrapeQueueData>,
  document: Document,
) {
  return job.data.document.id === document.id;
}
