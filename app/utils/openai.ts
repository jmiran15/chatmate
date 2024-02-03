import { Embedding } from "@prisma/client";
import OpenAI from "openai";

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
export async function chat() {
  return null;
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
  SELECT id, content,
    (-1 * (embedding <#> ${userEmbedding}::vector)) as similarity
  FROM "Embedding"
  WHERE "chatbotId" = ${chatbotId}
  ORDER BY similarity DESC
  LIMIT 1;
`;

  return relevantDocs;
}

// async function main() {
//   const completion = await openai.chat.completions.create({
//     messages: [{ role: "system", content: "You are a helpful assistant." }],
//     model: "gpt-3.5-turbo",
//   });

//   console.log(completion.choices[0]);
// }

// main();

// {
//   "id": "chatcmpl-123",
//   "object": "chat.completion",
//   "created": 1677652288,
//   "model": "gpt-3.5-turbo-0613",
//   "system_fingerprint": "fp_44709d6fcb",
//   "choices": [{
//     "index": 0,
//     "message": {
//       "role": "assistant",
//       "content": "\n\nHello there, how may I assist you today?",
//     },
//     "logprobs": null,
//     "finish_reason": "stop"
//   }],
//   "usage": {
//     "prompt_tokens": 9,
//     "completion_tokens": 12,
//     "total_tokens": 21
//   }
// }
