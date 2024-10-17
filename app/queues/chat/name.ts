import invariant from "tiny-invariant";
import { openai } from "~/utils/providers.server";
import { Queue } from "~/utils/queue.server";

import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";

export const ChatNameSchema = z.object({
  chatName: z
    .string()
    .describe("A short, descriptive name for the chat thread"),
  sessionId: z.string(),
  sessionName: z.string(),
  nameChanged: z
    .boolean()
    .describe("Indicates whether the chat name was changed"),
});

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

export async function generate(
  messages: { role: "user" | "assistant"; content: string }[],
  sessionId: string,
  sessionName: string,
  previousName?: string,
): Promise<z.infer<typeof ChatNameSchema> | null> {
  const lastMessages = messages.slice(-6);

  try {
    const completion = await openai.beta.chat.completions.parse(
      {
        model: "gpt-4o-mini",
        messages: [
          systemPrompt,
          userPrompt({ messages: lastMessages, previousName }),
        ],
        response_format: zodResponseFormat(ChatNameSchema, "chat_name"),
        temperature: 0,
        max_tokens: 256,
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
          "Helicone-Session-Id": sessionId, // the message id
          "Helicone-Session-Path": "/message/name", // /message
          "Helicone-Session-Name": sessionName, // the chat name
        },
      },
    );

    const result = completion.choices[0].message;

    if (result.parsed) {
      return result.parsed;
    } else if (result.refusal) {
      return null;
    }
  } catch (e) {
    if (e.constructor.name == "LengthFinishReasonError") {
      // Retry with a higher max tokens
      console.log("Too many tokens: ", e.message);
    } else {
      // Handle other exceptions
      console.log("An error occurred: ", e.message);
    }
  }
  return null;
}

const systemPrompt = {
  role: "system",
  content: [
    {
      type: "text",
      text: 'You are a chat thread naming system for an AI chatbot platform. Your task is to generate or maintain a concise, descriptive name for each chat thread. Follow these guidelines:\n\n1. Create a name that summarizes the main topic or intent of the conversation.\n2. Keep the name short and clear, maximum 50 characters.\n3. Use title case for consistency (e.g., "Product Pricing Inquiry").\n4. If the conversation topic changes significantly, update the name accordingly.\n5. Avoid changing the name for minor topic shifts to maintain consistency.\n6. If the conversation is unfocused or consists of test messages, use a generic name like "General Inquiry" or "Test Conversation".\n7. Prioritize naming based on user intents or questions rather than bot responses.\n8. If pricing or features are discussed, include that in the name (e.g., "Pricing Plans Inquiry").\n\nRemember:\n- Consistency is key. Don\'t change the name unless there\'s a significant topic shift.\n- Focus on the user\'s main inquiry or the dominant theme of the conversation.\n- If the chat consists mostly of greetings or test messages, keep the existing name or use a generic one.\n\nOutput your response in the specified JSON format, including whether the name was changed.',
    },
  ],
} as ChatCompletionMessageParam;

const userPrompt = ({
  messages,
  previousName,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  previousName?: string;
}) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: `Previous chat name: ${
          previousName ?? "No previous chat name"
        }\n\nChat history:\n${messages
          .map((message) => `${message.role}: ${message.content}`)
          .join(
            "\n",
          )}\nBased on this information, generate or maintain an appropriate chat name. If the existing name is still relevant, keep it. Only change the name if there's a significant shift in the conversation topic. Output your response in the specified JSON format.`,
      },
    ],
  }) as ChatCompletionMessageParam;
