import { FlowProducer } from "bullmq";
import { getChat } from "~/queues/chat/db/getChat";
import { updateChatFromChildrenQueue } from "~/queues/chat/db/updateChat";
import { generateAIInsights } from "~/queues/chat/insights";
import { generateChatName } from "~/queues/chat/name";
import { redis } from "~/utils/redis.server";

export const flowProducer = new FlowProducer({ connection: redis });

export async function startNameGenerationFlow({ chatId }: { chatId: string }) {
  const flow = await flowProducer.add({
    name: `update-chat-${chatId}`,
    queueName: updateChatFromChildrenQueue.name,
    data: { chatId },
    children: [
      {
        name: `generate-name-${chatId}`,
        queueName: generateChatName.name,
        data: { chatId },
        children: [
          {
            name: `get-chat-${chatId}`,
            queueName: getChat.name,
            data: { chatId },
          },
        ],
      },
    ],
  });

  return flow;
}

export async function startInsightsFlow({ chatId }: { chatId: string }) {
  const flow = await flowProducer.add({
    name: `update-chat-${chatId}`,
    queueName: updateChatFromChildrenQueue.name,
    data: { chatId },
    children: [
      {
        name: `generate-insights-${chatId}`,
        queueName: generateAIInsights.name,
        data: { chatId },
        children: [
          {
            name: `get-chat-${chatId}`,
            queueName: getChat.name,
            data: { chatId },
          },
        ],
      },
    ],
  });

  return flow;
}
