import { queue } from "~/queues/ingestion.server";
import { eventStream } from "remix-utils/sse/server";
import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // id will be the document id, since we passed it in when queueing the job
  const { id } = params;

  if (!id) {
    return new Response("Not found", { status: 404 });
  }

  const job = await queue.getJob(id);

  if (!job) {
    return new Response("Not found", { status: 404 });
  }

  return eventStream(request.signal, function setup(send) {
    job.isCompleted().then((completed) => {
      if (completed) {
        send({ event: "progress", data: String(100) });
      }
    });
    queue.events.on("progress", onProgress);
    function onProgress({
      jobId,
      data,
    }: {
      jobId: string;
      data: number | object;
    }) {
      if (jobId !== id) return;
      send({ event: "progress", data: String(data) });
      if (data === 100) {
        queue.events.off("progress", onProgress);
      }
    }
    return function clear() {
      queue.events.off("progress", onProgress);
    };
  });
}
