import { Embedding } from "@prisma/client";
import OpenAI from "openai";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { system_prompt } from "./prompts";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbeddings({ input }: { input: string }) {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: input.replace(/\n/g, " "),
      encoding_format: "float",
    });

    return embedding.data[0].embedding as number[];
  } catch (e) {
    console.log("Error calling OpenAI embedding API: ", e);
    throw new Error(`Error calling OpenAI embedding API: ${e}`);
  }
}

export async function chat({
  chatbotId,
  messages,
}: {
  chatbotId: string;
  messages: { role: "user" | "assistant"; content: string }[];
}) {
  invariant(messages.length > 0, "Messages must not be empty");
  invariant(
    messages[messages.length - 1].role === "user",
    "Last message must be from the user",
  );

  const query = messages[messages.length - 1].content;

  const references = (await fetchRelevantDocs({
    chatbotId,
    input: query,
  })) as Embedding[];

  const userPromptWithReferences = `
  Below are some relevant documents that may help answer your question:
${references
  .map((reference) => `Document[${reference.documentId}]: ${reference.content}`)
  .join("\n")}
User: ${query}; Chatbot:`;

  messages[messages.length - 1].content = userPromptWithReferences;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: system_prompt }, ...messages],
    model: "gpt-3.5-turbo",
  });

  return completion.choices[0];
}

export async function fetchRelevantDocs({
  chatbotId,
  input,
}: {
  chatbotId: string;
  input: string;
}) {
  const userEmbedding = await getEmbeddings({ input });

  const relevantDocs = await prisma.$queryRaw`
  SELECT id, content, "documentId",
    (-1 * (embedding <#> ${userEmbedding}::vector)) as similarity
  FROM "Embedding"
  WHERE "chatbotId" = ${chatbotId}
  ORDER BY similarity DESC
  LIMIT 5;
`;

  return relevantDocs;
}

// function to generate a name for the chat
export async function generateChatName(
  chat: { role: "user" | "assistant"; content: string }[],
) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Generate a short name for the chat. I should be able to see only the chat name and know what the chat is about. For example, if in the chat the user is talking about a heap in java algorithms, your chat name should be something like 'Java heaps'; if the user is inquiring about a new feature, you should name the chat something like 'New chat inquiry', or naming the actual feature would be even better.",
      },
      {
        role: "user",
        content: `Chat: ${chat
          .map((message) => `${message.role}: ${message.content}`)
          .join("\n")}\nChat name:`,
      },
    ],
    model: "gpt-4-0125-preview",
  });

  return {
    chatName: completion.choices[0].message.content as string,
  };
}

export async function generateChatSummary(
  chat: { role: "user" | "assistant"; content: string }[],
) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Generate a list of key insights about a chat that a user had with a chatbot. Each insight should be about one key takeaway from the chat. Your key takeaways should be about what the user is doing! These insights will be helpful to the chatbot owner, who wants to know how users are interaction with the chatbot. For example, if the user is asking about something in the chat, you should point this out as one of the insights; if they sound angry, or confused, or some other emotion, you should point this out. Key takeaways are essentially the top 5 things that a chatbot owner would take away when analyzing chats that user's had with their chatbot. Insights must be AT MOST one sentence long. Your list should have AT MOST 5 INSIGHTS.\nYour responses should be in the following format: 'item 1\nitem 2\nitem 3\nitem 4\nitem 5'. You do not NEED all 5 items, but you should have at least 1 strong bullet point. In fact, shorter is better! DO NOT ADD ANY MARKDOWN OR HTML TO YOUR RESPONSE. Just plain text, one insight per line. For example numbered lists, bulleted lists, etc, are ALL WRONG! Just plain text, one insight per line. You do not need to have a key insight per message; for example, the user may ask a question about X and the chatbot/assistant later responds about X. In this case (and all similar cases) you do NOT need an insight saying the the user asked about X and another insight saying that the assitant responded about X. Just have one concise insight indicating the user's intent.",
      },
      {
        role: "user",
        content: `Chat: ${chat
          .map((message) => `${message.role}: ${message.content}`)
          .join("\n")}\nChat list with max of 5 key insights:`,
      },
    ],
    model: "gpt-4-0125-preview",
  });

  return {
    chatSummary: completion.choices[0].message.content as string,
  };
}
