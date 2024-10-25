import { Queue as BullQueue, Processor, QueueEvents, Worker } from "bullmq";
import { redis } from "./redis.server";

interface AugmentedQueue<T> extends BullQueue<T> {
  events: QueueEvents;
}

export interface RegisteredQueue {
  queue: BullQueue;
  queueEvents: QueueEvents;
  worker: Worker;
}

declare global {
  // eslint-disable-next-line no-var
  var __registeredQueues: Record<string, RegisteredQueue> | undefined;
}

const registeredQueues =
  global.__registeredQueues || (global.__registeredQueues = {});

export function Queue<Payload>(
  name: string,
  handler: Processor<Payload>,
): AugmentedQueue<Payload> {
  if (!registeredQueues[name]) {
    const queue = new BullQueue(name, { connection: redis });
    const queueEvents = new QueueEvents(name, { connection: redis });
    const worker = new Worker<Payload>(name, handler, {
      connection: redis,
      lockDuration: 1000 * 60 * 15,
      concurrency: 16,
    });

    registeredQueues[name] = {
      queue,
      queueEvents,
      worker,
    };
  }

  const queue = registeredQueues[name].queue as AugmentedQueue<Payload>;
  queue.events = registeredQueues[name].queueEvents;

  return queue;
}
