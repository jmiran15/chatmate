import { hpf, hpstatic } from "@helicone/prompts";

import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { openai } from "~/utils/providers.server";

const MODEL = "gpt-4o-mini";

const AugmentationSchema = z.object({
  conciseSummary: z
    .string()
    .describe("A concise summary of the original answer (50-75 words)"),
  keyPoints: z.array(z.string()).describe("5-7 key points in full sentences"),
  rephrasedVersion: z
    .string()
    .describe("A rephrased version of the original answer"),
  simplifiedVersion: z
    .string()
    .describe(
      "A simplified version of the answer, avoiding jargon and complex terms",
    ),
  expandedVersion: z
    .string()
    .describe("An expanded version including related terms or concepts"),
  bulletPointVersion: z
    .array(z.string())
    .describe("Main ideas in bullet point format"),
  paragraphVersion: z.string().describe("Main ideas in paragraph format"),
  keywords: z
    .array(z.string())
    .describe("10-15 important keywords or phrases from the answer"),
  potentialQuestions: z
    .array(z.string())
    .describe("5-7 potential questions this answer addresses"),
  semanticVariations: z
    .array(z.string())
    .describe("5-7 semantically similar phrases for key concepts"),
  context: z
    .string()
    .describe("Brief contextual information or category for the answer"),
  sourceType: z
    .string()
    .describe("Type of source (e.g., policy document, FAQ, description)"),
  temporalRelevance: z
    .string()
    .describe(
      "Temporal relevance of the information (e.g., current, historical, future projection)",
    ),
  relatedConcepts: z
    .array(z.string())
    .describe("3-5 closely related topics or concepts not directly mentioned"),
});

const augmentDocumentSystemPrompt = {
  role: "system",
  content: [
    {
      type: "text",
      text: hpstatic`You are an AI assistant specializing in processing documents for a Retrieval Augmented Generation (RAG) system. Your task is to analyze a given document and generate multiple versions to enhance the system's ability to match diverse user queries. Approach this task methodically and creatively, keeping in mind the goal of improving the RAG system's accuracy and relevance.\n\nFollow these guidelines:\n\n1. Analyze the original answer thoroughly, understanding its main points, structure, and nuances.\n\n2. Generate the following versions of the answer:\n   a) A concise summary (50-75 words)\n   b) A list of 5-7 key points in full sentences\n   c) A rephrased version that conveys the same information but with different wording\n   d) A simplified version, avoiding jargon and complex terms\n   e) An expanded version that includes common related terms or concepts (be cautious not to introduce inaccuracies)\n   f) A bullet point version and a paragraph version of the main ideas\n\n3. Create a list of 10-15 important keywords or phrases from the answer.\n\n4. Generate a list of 5-7 potential questions this answer addresses.\n\n5. Provide a list of 5-7 semantically similar phrases for key concepts in the answer.\n\nEnsure each version and component adds unique value without unnecessary repetition. Use diverse vocabulary and phrasing throughout to maximize the potential for matching various query formulations. The goal is to create a comprehensive set of variations that will enhance the RAG system's ability to provide accurate and relevant responses to a wide range of user queries.`,
    },
  ],
} as ChatCompletionMessageParam;

const augmentDocumentUserPrompt = ({ baseAnswer }: { baseAnswer: string }) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: hpf`Please process the following answer for our RAG system. Generate multiple versions and components of the answer as specified in the system prompt. Ensure each element is distinct and adds value to our embedding set.\n\nOriginal Answer:\n\`\`\`md\n${{
          baseAnswer,
        }}\n\`\`\`\n\nProvide your output in the structured format defined in the response_format. Focus on creating variations that will be useful for matching a wide range of potential user queries.`,
      },
    ],
  }) as ChatCompletionMessageParam;

export async function augmentDocument({
  baseQuestion,
  baseAnswer,

  sessionId,
}: {
  baseQuestion?: string;
  baseAnswer: string;
  sessionId?: string;
}): Promise<z.infer<typeof AugmentationSchema> | null> {
  try {
    const completion = await openai.beta.chat.completions.parse(
      {
        model: MODEL,
        messages: [
          augmentDocumentSystemPrompt,
          augmentDocumentUserPrompt({ baseAnswer }),
        ],
        response_format: zodResponseFormat(AugmentationSchema, "augmentation"),
        temperature: 0,
        max_tokens: 2048,
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
          ...(sessionId &&
            baseQuestion && {
              "Helicone-Session-Id": sessionId,
              "Helicone-Session-Path": "/ingestion/augment_document",
              "Helicone-Session-Name": baseQuestion,
              "Helicone-Prompt-Id": "qa_ingestion_augment_document",
            }),
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
