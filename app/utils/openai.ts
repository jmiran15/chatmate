import { Chatbot, Document, DocumentType, Embedding } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { system_prompt, user_prompt } from "./prompts";
import { v4 as uuidv4 } from "uuid";
import { ANYSCALE_MODELS } from "~/routes/chatbots.$chatbotId.settings/route";
import { openai, anyscale } from "./providers.server";
import { Chunk, FullDocument, UNSTRUCTURED_URL } from "./types";

export const CHUNK_SIZE = 1024;
export const OVERLAP = 20;

export async function embed({ input }: { input: string }) {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: input.replace(/\n/g, " "),
      encoding_format: "float",
    });

    return embedding.data[0].embedding as number[];
  } catch (e) {
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
  invariant(messages.length > 0, "Messages must not be empty");
  invariant(
    messages[messages.length - 1].role === "user",
    "Last message must be from the user",
  );

  const query = messages[messages.length - 1].content;

  // THIS STUFF SHOULD BE DONE OUTSIDE OF THE "CHAT" FUNCTION SO THAT IT IS PURE
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

  const client = ANYSCALE_MODELS.includes(chatbot.model) ? anyscale : openai;

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
  const userEmbedding = await embed({ input });

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
    model: "gpt-3.5-turbo-0125",
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
    model: "gpt-3.5-turbo-0125",
  });

  return {
    chatSummary: completion.choices[0].message.content as string,
  };
}

export function splitStringIntoChunks(
  document: Document,
  chunkSize: number,
  overlap: number,
): Chunk[] {
  if (chunkSize <= 0) {
    throw new Error("Chunk size must be greater than 0.");
  }

  if (overlap >= chunkSize) {
    throw new Error("Overlap must be smaller than the chunk size.");
  }

  const chunks: Chunk[] = [];
  let startIndex = 0;

  while (startIndex < document.content.length) {
    const endIndex = Math.min(startIndex + chunkSize, document.content.length);
    const chunk = document.content.substring(startIndex, endIndex);
    const chunkId = uuidv4();
    chunks.push({
      content: chunk,
      id: chunkId,
      documentId: document.id,
    });
    startIndex += chunkSize - overlap;

    // If the overlap is greater than the remaining characters, break to avoid an empty chunk
    if (startIndex + overlap >= document.content.length) {
      break;
    }
  }

  return chunks;
}

export async function generateSummaryForChunk(chunk: Chunk): Promise<Chunk> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Generate a short 2 sentence summary that describes the semantics of the chunk.",
      },
      {
        role: "user",
        content: `Chunk: ${chunk.content}\n Summary:`,
      },
    ],
    model: "gpt-3.5-turbo-0125",
  });

  const chunkId = uuidv4();
  return {
    content: completion.choices[0].message.content as string,
    id: chunkId,
    documentId: chunk.documentId,
  };
}

export async function generatePossibleQuestionsForChunk(
  chunk: Chunk,
): Promise<Chunk[]> {
  // fetch call to openai with prompt to generate 10 possible questions that a user could ask about this chunk
  // return the new questions as chunks
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Generate 10 possible questions that a user could ask about this chunk. Your questions should be seperated by a new line.",
      },
      {
        role: "user",
        content: `Chunk: ${chunk.content}\n10 questions separated by a new line:`,
      },
    ],
    model: "gpt-3.5-turbo-0125",
  });

  const questionsContent = (
    completion.choices[0].message.content as string
  ).split("\n") as string[];

  return questionsContent.map((question) => {
    const id = uuidv4();

    return {
      content: question,
      id,
      documentId: chunk.documentId,
    };
  });
}

export async function convertUploadedFilesToDocuments(
  files: FormDataEntryValue[],
): Promise<(FullDocument & { type: DocumentType })[]> {
  const newFormData = new FormData();

  // Append each file to the new FormData instance
  files.forEach((file) => {
    newFormData.append("files", file);
  });

  const response = await fetch(UNSTRUCTURED_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "unstructured-api-key": process.env.UNSTRUCTURED_API_KEY as string,
    },
    body: newFormData,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to partition file with error ${
        response.status
      } and message ${await response.text()}`,
    );
  }

  const elements = await response.json();
  if (!Array.isArray(elements)) {
    throw new Error(
      `Expected partitioning request to return an array, but got ${elements}`,
    );
  }

  if (elements[0].constructor !== Array) {
    return [
      {
        name: elements[0].metadata.filename,
        content: elements.map((element) => element.text).join("\n"),
        type: DocumentType.FILE,
        id: uuidv4(),
      },
    ];
  } else {
    return elements.map((fileElements) => {
      return {
        name: fileElements[0].metadata.filename,
        content: fileElements.map((element) => element.text).join("\n"),
        id: uuidv4(),
        type: DocumentType.FILE,
      };
    });
  }
}
