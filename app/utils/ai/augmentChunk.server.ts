import { hpf, hpstatic } from "@helicone/prompts";

import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { openai } from "~/utils/providers.server";
import { Chunk } from "../../queues/ingestion/ingestion.server";

const MODEL = "gpt-4o-mini";

const augmentChunkSystemPrompt = {
  role: "system",
  content: [
    {
      text: hpstatic`You are an AI assistant specialized in processing chunks of documents for a Retrieval Augmented Generation (RAG) system. Your task is to analyze given document chunks and generate multiple versions and extractions to enhance the system's ability to match diverse user queries. Approach this task methodically and creatively, keeping in mind that these chunks may be parts of larger documents and may not always contain complete ideas.\n\nFollow these guidelines:\n\n1. Analyze the document chunk thoroughly, understanding its main points, structure, and context.\n\n2. Generate the following versions of the chunk content:\n   a) A concise summary (50-75 words) of the main ideas in the chunk\n   b) A list of 5-7 key points in full sentences\n   c) A rephrased version that conveys the same information but with different wording\n   d) A simplified version, avoiding jargon and complex terms\n\n3. Create a list of 10-15 important keywords or phrases from the chunk.\n\n4. Provide a list of 5-7 semantically similar phrases for key concepts in the chunk.\n\n5. If applicable, extract any quantitative data, statistics, or specific facts into a separate section.\n\n6. Identify the main topics or themes discussed in the chunk (3-5 topics).\n\n7. If the chunk seems to be part of a larger section, speculate on what the broader context might be.\n\n8. List any entities (people, organizations, products, etc.) mentioned in the chunk.\n\n9. Identify the tone and style of the writing (e.g., formal, technical, conversational, persuasive).\n\n10. If relevant, specify the type of content (e.g., product description, company history, technical specification).\n\n11. Note any incomplete ideas or sentences at the beginning or end of the chunk that might connect to other parts of the document.\n\nEnsure each version and component adds unique value without unnecessary repetition. Use diverse vocabulary and phrasing throughout to maximize the potential for matching various query formulations. The goal is to create a comprehensive set of variations and extractions that will enhance the RAG system's ability to provide accurate and relevant responses to a wide range of user queries, even when working with partial document chunks.`,
      type: "text",
    },
  ],
} as ChatCompletionMessageParam;

const augmentChunkUserPrompt = ({ content }: { content: string }) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: hpf`Please process the following document chunk for our RAG system. Generate multiple versions and components of the chunk content as specified in the system prompt. Ensure each element is distinct and adds value to our embedding set.\n\nDocument Chunk:\n${{
          content,
        }}\n\nProvide your output in the structured format defined in the response_format. Focus on creating variations and extractions that will be useful for matching a wide range of potential user queries, keeping in mind that this chunk may be part of a larger document.`,
      },
    ],
  }) as ChatCompletionMessageParam;

export const DocumentChunkProcessingSchema = z.object({
  conciseSummary: z
    .string()
    .describe("A concise summary of the main ideas in the chunk (50-75 words)"),
  keyPoints: z.array(z.string()).describe("5-7 key points in full sentences"),
  rephrasedVersion: z
    .string()
    .describe("A rephrased version of the chunk content"),
  simplifiedVersion: z
    .string()
    .describe(
      "A simplified version of the content, avoiding jargon and complex terms",
    ),
  keywords: z
    .array(z.string())
    .describe("10-15 important keywords or phrases from the chunk"),
  semanticVariations: z
    .array(z.string())
    .describe("5-7 semantically similar phrases for key concepts"),
  extractedData: z
    .array(z.string())
    .optional()
    .describe(
      "Extracted quantitative data, statistics, or specific facts, if applicable",
    ),
  mainTopics: z
    .array(z.string())
    .describe("3-5 main topics or themes discussed in the chunk"),
  speculatedContext: z
    .string()
    .describe(
      "Speculation on the broader context if the chunk seems to be part of a larger section",
    ),
  entities: z
    .array(z.string())
    .describe(
      "List of entities (people, organizations, products, etc.) mentioned in the chunk",
    ),
  toneAndStyle: z.string().describe("Identified tone and style of the writing"),
  contentType: z.string().describe("Specified type of content, if relevant"),
  incompleteIdeas: z
    .array(z.string())
    .optional()
    .describe(
      "Notes on any incomplete ideas or sentences at the beginning or end of the chunk",
    ),
});

export async function augmentChunk({
  chunk,
  sessionId,
}: {
  chunk: Chunk;
  sessionId: string;
}): Promise<z.infer<typeof DocumentChunkProcessingSchema> | null> {
  try {
    const completion = await openai.beta.chat.completions.parse(
      {
        model: MODEL,
        messages: [
          augmentChunkSystemPrompt,
          augmentChunkUserPrompt({ content: chunk.content }),
        ],
        response_format: zodResponseFormat(
          DocumentChunkProcessingSchema,
          "augmentation",
        ),
        temperature: 0,
        max_tokens: 2048,
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
          "Helicone-Session-Id": sessionId,
          "Helicone-Session-Path": "/ingestion/augment_chunk",
          "Helicone-Session-Name": chunk.content.substring(0, 50), // Use first 50 chars of chunk as session name
          "Helicone-Prompt-Id": "ingestion_augment_chunk",
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
    if ((e as Error).constructor.name == "LengthFinishReasonError") {
      // Retry with a higher max tokens
      console.log("Too many tokens: ", (e as Error).message);
    } else {
      // Handle other exceptions
      console.log("An error occurred: ", (e as Error).message);
    }
  }
  return null;
}
