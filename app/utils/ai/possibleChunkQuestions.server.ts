import { hpf, hpstatic } from "@helicone/prompts";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { openai } from "~/utils/providers.server";
import { Chunk } from "../../queues/ingestion/ingestion.server";

const MODEL = "gpt-4o-mini";

export const ChunkBasedQuestionGenerationSchema = z.object({
  generatedQuestions: z
    .array(z.string())
    .describe("Array of generated questions based on the document chunk"),
  mainTopics: z
    .array(z.string())
    .describe("Main topics or themes covered in the document chunk"),
});

const possibleQuestionsSystemPrompt = {
  role: "system",
  content: [
    {
      type: "text",
      text: hpstatic`You are an AI assistant specialized in generating diverse questions based on document chunks for a Retrieval Augmented Generation (RAG) system. Your task is to create a range of questions that, if asked by a user, would make this document chunk a relevant result. The questions you generate will be used to create vector embeddings for improving search relevance.\n\nFollow these guidelines:\n\n1. Analyze the document chunk thoroughly, understanding its main points, details, and implicit information.\n\n2. Generate a set of unique questions that could be answered by the information in the chunk. The number of questions should be appropriate to the content - more for information-rich chunks, fewer for simpler or repetitive content.\n\n3. Focus on diversity in your questions, including:\n   - Questions about main ideas and specific details\n   - Questions using different phrasings and vocabulary\n   - Both simple and complex questions\n   - Questions from various perspectives (e.g., customer, employee, expert, novice)\n\n4. Include different types of questions such as yes/no, open-ended, \"how\" and \"why\" questions, and questions about definitions or explanations of terms used in the chunk.\n\n5. Create questions that might use synonyms or related terms not explicitly mentioned in the chunk.\n\n6. If applicable, include questions that combine multiple aspects of the chunk's content.\n\n7. If the chunk contains any numerical data, statistics, or specific facts, include questions about these.\n\n8. Avoid generating redundant or overly similar questions. Each question should add unique value.\n\n9. If the chunk doesn't contain enough substantial information to generate multiple unique questions, it's okay to generate fewer questions.\n\nRemember, the goal is to create a set of diverse, relevant questions that will enhance the RAG system's ability to match this document chunk to a wide range of potential user queries. Prioritize quality and relevance over quantity.`,
    },
  ],
} as ChatCompletionMessageParam;

const possibleQuestionsUserPrompt = ({ content }: { content: string }) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: hpf`Given the following document chunk, generate a set of diverse questions that could be answered by the information contained within it. These questions will be used to improve vector embedding-based retrieval in a RAG system.\n\nDocument Chunk:\n\`\`\`md\n${{
          content,
        }}\n\`\`\`\n\nPlease provide your output in the structured format defined in the response_format. Ensure that your generated questions cover a wide range of aspects and potential query formulations related to the chunk's content, without creating unnecessary or redundant questions.`,
      },
    ],
  }) as ChatCompletionMessageParam;

export async function generateChunkBasedQuestions({
  chunk,
  sessionId,
}: {
  chunk: Chunk;
  sessionId: string;
}): Promise<z.infer<typeof ChunkBasedQuestionGenerationSchema> | null> {
  try {
    const completion = await openai.beta.chat.completions.parse(
      {
        model: MODEL,
        messages: [
          possibleQuestionsSystemPrompt,
          possibleQuestionsUserPrompt({ content: chunk.content }),
        ],
        response_format: zodResponseFormat(
          ChunkBasedQuestionGenerationSchema,
          "possibleQuestions",
        ),
        temperature: 0,
        max_tokens: 2048,
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
          "Helicone-Session-Id": sessionId,
          "Helicone-Session-Path": "/ingestion/possible_questions",
          "Helicone-Session-Name": chunk.content.substring(0, 50), // Use first 50 chars of chunk as session name
          "Helicone-Prompt-Id": "ingestion_possible_questions",
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
