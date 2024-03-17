import { Chatbot, Embedding } from "@prisma/client";
import OpenAI from "openai";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { system_prompt, user_prompt } from "./prompts";
import Groq from "groq-sdk";
import {
  ANYSCALE_MODELS,
  GROQ_MODELS,
} from "~/routes/chatbots.$chatbotId.settings";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const anyscale = new OpenAI({
  baseURL: process.env.ANYSCALE_BASE_URL,
  apiKey: process.env.ANYSCALE_API_KEY,
});

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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
  chatbot,
  messages,
}: {
  chatbot: Chatbot;
  messages: { role: "user" | "assistant"; content: string }[];
}) {
  console.log("messages", messages);
  invariant(messages.length > 0, "Messages must not be empty");
  invariant(
    messages[messages.length - 1].role === "user",
    "Last message must be from the user",
  );

  const query = messages[messages.length - 1].content;

  const references = (await fetchRelevantDocs({
    chatbotId: chatbot.id,
    input: query,
  })) as Embedding[];

  const SP = system_prompt({
    chatbotName: chatbot.name,
    systemPrompt: chatbot.systemPrompt
      ? chatbot.systemPrompt
      : "Your are a friendly chatbot here to help you with any questions you have.",
    responseLength: chatbot.responseLength ? chatbot.responseLength : "short",
    startWords:
      chatbot.responseLength === "short"
        ? "25"
        : chatbot.responseLength === "medium"
        ? "50"
        : "100",
    endWords:
      chatbot.responseLength === "short"
        ? "50"
        : chatbot.responseLength === "medium"
        ? "100"
        : "100+",
  });

  const UP = user_prompt({
    retrievedData: references
      .map(
        (reference) =>
          `VERIFIED_SOURCE_[${reference.documentId}]: ${reference.content}`,
      )
      .join("\n"),
    question: query,
  });

  messages[messages.length - 1].content = UP;

  const client = ANYSCALE_MODELS.includes(chatbot.model)
    ? anyscale
    : GROQ_MODELS.includes(chatbot.model)
    ? groq
    : openai;

  console.log("messages going to openai: ", [
    { role: "system", content: SP },
    ...messages,
  ]);

  const stream = await client.chat.completions.create({
    messages: [{ role: "system", content: SP }, ...messages],
    model: chatbot.model,
    stream: true,
  });

  return stream;
}

// WE NEED TO BE SUMMARIZING THE PREV CHAT AS WELL AND USING THAT TO GET EMBEDDINGS
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
