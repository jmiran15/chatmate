import type { Message } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { Queue } from "~/utils/queue.server";
import { call } from "./llm.server";

export interface AnalyzeChatQueueData {
  chatId: string;
}

export const analyzeChat = Queue<AnalyzeChatQueueData>(
  "analyzeChat",
  async (job): Promise<Message> => {
    const childrenValues = await job.getChildrenValues();
    const chat = Object.values(childrenValues)[0];

    invariant(
      chat?.id === job.data.chatId,
      `Chat ID mismatch: ${chat?.id} !== ${job.data.chatId}`,
    );

    // Find the last user message (query) and last assistant message (answer)
    const lastUserMessage = chat?.messages
      ?.filter((msg: Message) => msg.role === "user")
      .pop();
    const lastAssistantMessage = chat?.messages
      ?.filter((msg: Message) => msg.role === "assistant")
      .pop();

    invariant(lastUserMessage, "No user message found in chat history");
    invariant(
      lastAssistantMessage,
      "No assistant message found in chat history",
    );

    const analysis = await call({
      history: chat?.messages,
      query: lastUserMessage.content,
      answer: lastAssistantMessage.content,
    });

    return await prisma.message.update({
      where: { id: lastAssistantMessage.id },
      data: {
        didNotFulfillQuery: analysis?.answered_query === false,
        reasoning: analysis?.reasoning ?? "",
      },
    });
  },
);
