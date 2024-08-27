import invariant from "tiny-invariant";
import { generateChatName as generate } from "~/utils/openai";
import { Queue } from "~/utils/queue.server";

export interface GenerateChatNameQueueData {
  chatId: string;
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

    const formattedMessages = chat?.messages?.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

    const newName = await generateName({
      messages: formattedMessages,
    });

    return { name: newName };
  },
);

async function generateName({
  messages,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
}) {
  // generate a name for the chat
  const newName = await generate(messages);

  if (!newName.chatName) {
    throw new Error("Failed to generate a name for the chat");
  }

  return newName.chatName;
}
