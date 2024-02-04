import { Embedding } from "@prisma/client";
import OpenAI from "openai";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embed({ input }: { input: string }) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input,
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
}

// this should take care of all the RAG stuff as well
// should just pass in all the model info, and messages, i.e. the chat api request params
// testing without specific chatbot for now

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
Create a concise and informative answer (no more than 50 words) for a given question
based solely on the given documents. You must only use information from the given documents.
Use an unbiased and journalistic tone. Do not repeat text. Cite the documents using Document[number] notation.
If multiple documents contain the answer, cite those documents like ‘as stated in Document[number], Document[number], etc.’.
If the documents do not contain the answer to the question, say that ‘answering is not possible given the available information.’
${references
  .map((reference) => `Document[${reference.documentId}]: ${reference.content}`)
  .join("\n")}
Question: ${query}; Answer:`;

  messages[messages.length - 1].content = userPromptWithReferences;

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      ...messages,
    ],
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
