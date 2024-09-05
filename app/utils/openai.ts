import { Chatbot, Document, Embedding } from "@prisma/client";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "~/db.server";
import {
  mainChatSystemPrompt_v2,
  mainChatUserPrompt_v2,
  mainTools,
} from "./prompts";
import { openai } from "./providers.server";
import { Chunk } from "./types";

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

  // TODO - move RAG into a pure function
  const references = (await fetchRelevantDocs({
    chatbotId: chatbot.id,
    input: query,
  })) as Embedding[];

  const systemPrompt = mainChatSystemPrompt_v2({
    chatbotName: chatbot.name,
    systemPrompt: chatbot.systemPrompt
      ? chatbot.systemPrompt
      : "Your are a friendly chatbot here to help you with any questions you have.",
    responseLength: chatbot.responseLength
      ? (chatbot.responseLength as "short" | "medium" | "long")
      : "short",
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

  const userPrompt = mainChatUserPrompt_v2({
    retrievedData: references
      .map(
        (reference) =>
          `VERIFIED_SOURCE_[${reference.documentId}]: ${reference.content}`,
      )
      .join("\n"),
    question: query,
  });

  messages[messages.length - 1].content = userPrompt;

  const stream = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    model: "gpt-4o",
    temperature: 0.2,
    stream: true,
    tools: mainTools,
  });

  return stream;
}

// TODO - modularize the RAG code out of here
// DOCUMENT RETRIEVAL (RAG)
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

// DOCUMENT PREPROCESSING FLOW
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

// TODO - switch to gpt-4o/mini + structured output
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

// TODO - switch to gpt-4o/mini + structured output
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
