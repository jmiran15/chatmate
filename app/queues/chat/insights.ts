import invariant from "tiny-invariant";
import { z } from "zod";
import {
  ChatInsightsSchema,
  generateInsights,
} from "~/utils/ai/insights.server";

import { Queue } from "~/utils/queue.server";

export interface GenerateInsightsQueueData {
  chatId: string;
  sessionId: string;
  sessionName: string;
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

    const formattedMessages = chat?.messages?.map((message: any) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

    const aiInsights: z.infer<typeof ChatInsightsSchema> | null =
      await generateInsights({
        messages: formattedMessages,
        sessionId: job.data.sessionId,
        sessionName: job.data.sessionName,
      });

    return {
      aiInsights: aiInsights
        ? aiInsights.insights.map((i) => i.content).join("\n")
        : "",
    };
  },
);
