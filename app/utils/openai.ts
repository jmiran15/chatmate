import { Embedding } from "@prisma/client";
import OpenAI from "openai";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { system_prompt } from "./prompts";

const openai = new OpenAI({
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
