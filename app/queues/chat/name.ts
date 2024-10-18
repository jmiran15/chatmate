import invariant from "tiny-invariant";
import { generate } from "~/utils/ai/chatName.server";
import { Queue } from "~/utils/queue.server";

export interface GenerateChatNameQueueData {
  chatId: string;
  sessionId: string;
  sessionName: string;
}

export interface GenerateChatNameQueueResult {
  name: string;
}

export const generateChatName = Queue<GenerateChatNameQueueData>(
  "generateChatName",
  async (job): Promise<GenerateChatNameQueueResult> => {
    const childrenValues = await job.getChildrenValues();
    const chat = Object.values(childrenValues)[0];

    invariant(
      chat?.id === job.data.chatId,
      `Chat ID mismatch: ${chat?.id} !== ${job.data.chatId}`,
    );

    const formattedMessages = chat?.messages
      ? chat.messages.map((message: { role: string; content: string }) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        }))
      : [];

    const previousName = chat?.name;

    const newName = await generate(
      formattedMessages,
      job.data.sessionId,
      job.data.sessionName,
      previousName,
    );

    return { name: newName ? newName.chatName : previousName };
  },
);
