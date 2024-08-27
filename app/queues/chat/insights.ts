import invariant from "tiny-invariant";
import { generateChatSummary } from "~/utils/openai";
import { Queue } from "~/utils/queue.server";

export interface GenerateInsightsQueueData {
  chatId: string;
}

export interface GenerateInsightsQueueResult {
  aiInsights: string;
}

export const generateAIInsights = Queue<GenerateInsightsQueueData>(
  "generateInsights",
  async (job): Promise<GenerateInsightsQueueResult> => {
    const childrenValues = await job.getChildrenValues();
    const chat = Object.values(childrenValues)[0];

    invariant(
      chat?.id === job.data.chatId,
      `Chat ID mismatch: ${chat?.id} !== ${job.data.chatId}`,
    );

    const formattedMessages = chat?.messages?.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

    const aiInsights = await generateInsights({
      messages: formattedMessages,
    });

    return { aiInsights };
  },
);

async function generateInsights({
  messages,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
}) {
  const insights = await generateChatSummary(messages);

  if (!insights.chatSummary) {
    throw new Error("Failed to generate insights for the chat");
  }

  return insights.chatSummary;
}
