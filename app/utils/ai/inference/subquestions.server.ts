import { hpf, hpstatic } from "@helicone/prompts";
import { ChatCompletionMessageParam as GroqChatCompletionMessageParam } from "groq-sdk/resources/chat/completions.mjs";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { groq, openai } from "../../providers.server";
import { checkRateLimits, correctTokenCount } from "../../rateLimiter";

const MODEL = "gpt-4o-mini";
const groqModel = "llama-3.2-90b-text-preview";
const groqTemp = 0;
const groqTokens = 1024;

const subquestionsSystemPrompt = {
  role: "system",
  content: [
    {
      type: "text",
      text: hpstatic`You are an advanced AI assistant specialized in query decomposition for a Retrieval Augmented Generation (RAG) system. Your task is to analyze user questions and, when necessary, break them down into simpler sub-questions that can be answered independently. This decomposition helps in retrieving relevant information from a document database more effectively.\n\nFollow these guidelines:\n\n1. Analyze the user's question thoroughly, understanding its complexity, main components, and any implicit parts.\n\n2. Determine if the question needs decomposition:\n   - Simple, straightforward questions may not need breaking down\n   - Complex questions involving multiple aspects, comparisons, or requiring step-by-step explanations are candidates for decomposition\n\n3. If decomposition is needed, generate 2-5 sub-questions that:\n   - Cover all aspects of the original question\n   - Can be answered independently\n   - Are simpler and more focused than the original question\n   - Maintain the context and intent of the original query\n\n4. Ensure the set of sub-questions, when answered together, would provide a comprehensive answer to the original question.\n\n5. For each sub-question, also generate 1-2 related search queries that could help find relevant information in a document database.\n\n6. If the original question involves a sequence or process, order the sub-questions logically.\n\n7. For comparative questions, create sub-questions that address each element separately before comparing.\n\n8. If the original query uses domain-specific terminology, consider creating sub-questions that define or explain these terms.\n\n9. For questions asking about causality or relationships, break down into sub-questions about individual elements and their connections.\n\nRemember, the goal is to create a set of sub-questions and search queries that will enhance the RAG system's ability to find and compile relevant information to answer complex user queries comprehensively.`,
    },
  ],
} as ChatCompletionMessageParam;

const subquestionsUserPrompt = (question: string) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: hpf`Analyze the following user question and, if necessary, decompose it into simpler sub-questions. Also, provide related search queries for each sub-question. If the question is simple and doesn't require decomposition, state that it doesn't need to be broken down and provide alternative phrasings instead.\n\nUser Question: \"${{
          question,
        }}\"\n\nPlease provide your output in the structured format defined in the response_format. Ensure that your decomposition (if applicable) covers all aspects of the original question while breaking it into manageable, focused parts.`,
      },
    ],
  }) as ChatCompletionMessageParam;

const SubQuestionSchema = z.object({
  question: z.string().describe("The sub-question"),
  searchQueries: z
    .array(z.string())
    .describe("Related search queries for this sub-question"),
});

export const QueryDecompositionSchema = z.object({
  originalQuestion: z.string().describe("The original user question"),
  requiresDecomposition: z
    .boolean()
    .describe("Whether the question needs to be decomposed"),
  explanation: z
    .string()
    .describe(
      "Brief explanation of why the question does or doesn't need decomposition",
    ),
  subQuestions: z
    .array(SubQuestionSchema)
    .optional()
    .describe("Array of sub-questions and their related search queries"),
  alternativePhrasings: z
    .array(z.string())
    .optional()
    .describe(
      "Alternative phrasings of the original question if decomposition is not needed",
    ),
});

export async function generateSubQuestions({
  originalQuery,
  sessionId,
  chatName,
}: {
  originalQuery: string;
  sessionId: string;
  chatName: string;
}): Promise<z.infer<typeof QueryDecompositionSchema> | null> {
  const estimatedTokens = originalQuery.split(" ").length * 2; // Rough estimate

  try {
    if (await checkRateLimits(estimatedTokens)) {
      const groqCompletion = await groq.chat.completions.create({
        messages: [groqSystem, groqUser(originalQuery)],
        model: groqModel,
        temperature: groqTemp,
        max_tokens: groqTokens,
        top_p: 1,
        stream: false,
        response_format: {
          type: "json_object",
        },
        stop: null,
      });

      // Correct token count
      const actualTokens = groqCompletion.usage?.total_tokens || 0;
      await correctTokenCount(actualTokens, estimatedTokens);

      const content = groqCompletion.choices[0]?.message?.content;
      if (content) {
        try {
          return QueryDecompositionSchema.parse(JSON.parse(content));
        } catch (parseError) {
          console.error("Failed to parse Groq response:", parseError);
        }
      }
    }
  } catch (error) {
    console.error("Error calling Groq API:", error);
  }

  // Fallback to OpenAI
  return openaiGenerateSubQuestions({ originalQuery, sessionId, chatName });
}

async function openaiGenerateSubQuestions({
  originalQuery,
  sessionId,
  chatName,
}: {
  originalQuery: string;
  sessionId: string;
  chatName: string;
}): Promise<z.infer<typeof QueryDecompositionSchema> | null> {
  try {
    const completion = await openai.beta.chat.completions.parse(
      {
        model: MODEL,
        messages: [
          subquestionsSystemPrompt,
          subquestionsUserPrompt(originalQuery),
        ],
        response_format: zodResponseFormat(
          QueryDecompositionSchema,
          "subQuestions",
        ),
        temperature: 0,
        max_tokens: 2048,
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
          "Helicone-Session-Id": sessionId,
          "Helicone-Session-Path": "/message/subquestions",
          "Helicone-Session-Name": chatName,
          "Helicone-Prompt-Id": "chat_subquestions",
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

const groqSystem = {
  role: "system",
  content:
    'You are an advanced AI assistant specialized in query decomposition for a Retrieval Augmented Generation (RAG) system. Your task is to analyze user questions and, when necessary, break them down into simpler sub-questions that can be answered independently. This decomposition helps in retrieving relevant information from a document database more effectively.\n\nFollow these guidelines:\n\n1. Analyze the user\'s question thoroughly, understanding its complexity, main components, and any implicit parts.\n\n2. Determine if the question needs decomposition:\n   - Simple, straightforward questions may not need breaking down\n   - Complex questions involving multiple aspects, comparisons, or requiring step-by-step explanations are candidates for decomposition\n\n3. If decomposition is needed, generate 2-5 sub-questions that:\n   - Cover all aspects of the original question\n   - Can be answered independently\n   - Are simpler and more focused than the original question\n   - Maintain the context and intent of the original query\n\n4. Ensure the set of sub-questions, when answered together, would provide a comprehensive answer to the original question.\n\n5. For each sub-question, also generate 1-2 related search queries that could help find relevant information in a document database.\n\n6. If the original question involves a sequence or process, order the sub-questions logically.\n\n7. For comparative questions, create sub-questions that address each element separately before comparing.\n\n8. If the original query uses domain-specific terminology, consider creating sub-questions that define or explain these terms.\n\n9. For questions asking about causality or relationships, break down into sub-questions about individual elements and their connections.\n\nOutput Format:\nYou MUST provide your response in a valid JSON format with the following structure:\n{\n  "originalQuestion": "string (the original user question)",\n  "requiresDecomposition": boolean,\n  "explanation": "string (brief explanation of why the question does or doesn\'t need decomposition)",\n  "subQuestions": [\n    {\n      "question": "string (a sub-question)",\n      "searchQueries": ["string (a related search query)", "string (another related search query)"]\n    },\n    ...\n  ],\n  "alternativePhrasings": ["string (an alternative phrasing)", "string (another alternative phrasing)", ...]\n}\n\nEnsure that your JSON output is properly formatted and contains all required fields. The "subQuestions" array should only be included if requiresDecomposition is true. The "alternativePhrasings" array should only be included if requiresDecomposition is false.\n\nDo not include any explanations or additional text outside of the JSON structure.',
} as GroqChatCompletionMessageParam;

const groqUser = (question: string) =>
  ({
    role: "user",
    content: `Analyze the following user question and, if necessary, decompose it into simpler sub-questions. If decomposition is needed, provide related search queries for each sub-question. If the question is simple and doesn\'t require decomposition, provide alternative phrasings instead.\n\nUser Question: "${question}"\n\nProvide your response in the specified JSON format, ensuring all required fields are included.`,
  }) as GroqChatCompletionMessageParam;
