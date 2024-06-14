import { eventStream } from "remix-utils/sse/server";
import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { id, queueName } = params; // jobId

  if (!id || !queueName) {
    return new Response("Not found", { status: 404 });
  }

  const registeredQueue = global.__registeredQueues[queueName];

  if (!registeredQueue) {
    return new Response("Not found", { status: 404 });
  }

  const job = await registeredQueue.queue.getJob(id);

  if (!job) {
    return new Response("Not found", { status: 404 });
  }

  return eventStream(request.signal, function setup(send) {
    registeredQueue.queueEvents.on("completed", completedHandler);
    registeredQueue.queueEvents.on("progress", progressHandler);

    async function progressHandler({
      jobId,
      data,
    }: {
      jobId: string;
      data: number | object;
    }) {
      if (jobId !== id) return;
      send({ event: "progress", data: JSON.stringify(data) });
    }

    async function completedHandler({
      jobId,
      returnvalue,
    }: {
      jobId: string;
      returnvalue: any;
    }) {
      if (jobId !== id) return;
      send({ event: "completed", data: JSON.stringify(returnvalue) });
    }

    return function clear() {
      registeredQueue.queueEvents.off("progress", progressHandler);
      registeredQueue.queueEvents.off("completed", completedHandler);
    };
  });
}
