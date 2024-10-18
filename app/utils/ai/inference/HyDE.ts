import { hpf, hpstatic } from "@helicone/prompts";
import { ChatCompletionMessageParam as GroqChatCompletionMessageParam } from "groq-sdk/resources/chat/completions.mjs";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { groq, openai } from "../../providers.server";
import { checkRateLimits, correctTokenCount } from "../../rateLimiter";

const MODEL = "gpt-4o-mini";

const HyDESystemPrompt = {
  role: "system",
  content: [
    {
      text: hpstatic`You are an advanced AI assistant specialized in generating hypothetical answers for a Hypothetical Document Embedding (HyDE) system within a Retrieval Augmented Generation (RAG) framework. Your task is to create plausible, relevant answers to user questions that could potentially match actual document content in a vector database.\n\nFollow these guidelines to generate optimal hypothetical answers:\n\n1. Analyze the user's question thoroughly, understanding its main points, implicit context, and the type of information being sought.\n\n2. Generate a hypothetical answer that:\n   - Is directly relevant to the question\n   - Contains key terms and concepts likely to appear in actual documents\n   - Balances specificity with generality to maximize potential matches\n   - Maintains a neutral, informative tone\n   - Avoids introducing speculative or potentially false information\n\n3. Structure the answer in a way that mimics how it might appear in a real document:\n   - For factual questions, present information clearly and concisely\n   - For procedural questions, use a step-by-step format if appropriate\n   - For conceptual questions, provide definitions and explanations\n\n4. Include relevant details that could appear in an actual document, such as:\n   - Common terminology in the subject area\n   - Typical phrases or sentence structures used in formal writing\n   - Plausible data points or statistics (without inventing specific figures)\n\n5. Adjust the length and complexity of the answer based on the question:\n   - Provide brief, focused answers for simple questions\n   - Offer more detailed responses for complex queries\n\n6. If the question is ambiguous or could have multiple interpretations, generate an answer that addresses the most likely interpretation.\n\n7. For questions about current events or time-sensitive information, generate an answer that could be valid across a range of recent time periods.\n\n8. If the question asks for opinions or subjective information, generate a balanced response that could represent a consensus view.\n\nRemember, the goal is to create a hypothetical answer that is likely to have high vector similarity with actual relevant documents in the database, thereby improving the retrieval process in the RAG system.`,
      type: "text",
    },
  ],
} as ChatCompletionMessageParam;

const HyDEUserPrompt = (question: string) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: hpf`Generate a hypothetical answer to the following question. This answer should be plausible and structured as if it were extracted from a relevant document, optimized for use in a Hypothetical Document Embedding (HyDE) system.\n\nUser Question: ${{
          question,
        }}\n\nPlease provide only the hypothetical answer, no other text. Ensure that your hypothetical answer is relevant, informative, and likely to match the content and style of actual documents addressing this topic.`,
      },
    ],
  }) as ChatCompletionMessageParam;

export const HyDEGenerationSchema = z.object({
  originalQuestion: z.string().describe("The original user question"),
  hypotheticalAnswer: z.string().describe("The generated hypothetical answer"),
  keyTerms: z
    .array(z.string())
    .describe("Important terms or concepts used in the hypothetical answer"),
  answerType: z
    .enum(["factual", "procedural", "conceptual", "opinion-based", "mixed"])
    .describe("The primary type of information provided in the answer"),
  confidenceLevel: z
    .enum(["high", "medium", "low"])
    .describe(
      "Estimated confidence in the relevance and accuracy of the hypothetical answer",
    ),
});

export async function generateHyDE({
  originalQuery,
  sessionId,
  chatName,
}: {
  originalQuery: string;
  sessionId: string;
  chatName: string;
}): Promise<z.infer<typeof HyDEGenerationSchema> | null> {
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
          return HyDEGenerationSchema.parse(JSON.parse(content));
        } catch (parseError) {
          console.error("Failed to parse Groq response:", parseError);
        }
      }
    }
  } catch (error) {
    console.error("Error calling Groq API:", error);
  }

  // Fallback to OpenAI
  return openaiGenerateHyDE({ originalQuery, sessionId, chatName });
}

async function openaiGenerateHyDE({
  originalQuery,
  sessionId,
  chatName,
}: {
  originalQuery: string;
  sessionId: string;
  chatName: string;
}): Promise<z.infer<typeof HyDEGenerationSchema> | null> {
  try {
    const completion = await openai.beta.chat.completions.parse(
      {
        model: MODEL,
        messages: [HyDESystemPrompt, HyDEUserPrompt(originalQuery)],
        response_format: zodResponseFormat(
          HyDEGenerationSchema,
          "hypotheticalAnswer",
        ),
        temperature: 0,
        max_tokens: 2048,
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
          "Helicone-Session-Id": sessionId,
          "Helicone-Session-Path": "/message/hyde",
          "Helicone-Session-Name": chatName,
          "Helicone-Prompt-Id": "chat_hyde",
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
    'You are an advanced AI assistant specialized in generating hypothetical answers for a Hypothetical Document Embedding (HyDE) system within a Retrieval Augmented Generation (RAG) framework. Your task is to create plausible, relevant answers to user questions that could potentially match actual document content in a vector database.\n\nFollow these guidelines to generate optimal hypothetical answers:\n\n1. Analyze the user\'s question thoroughly, understanding its main points, implicit context, and the type of information being sought.\n\n2. Generate a hypothetical answer that:\n   - Is directly relevant to the question\n   - Contains key terms and concepts likely to appear in actual documents\n   - Balances specificity with generality to maximize potential matches\n   - Maintains a neutral, informative tone\n   - Avoids introducing speculative or potentially false information\n\n3. Structure the answer in a way that mimics how it might appear in a real document:\n   - For factual questions, present information clearly and concisely\n   - For procedural questions, use a step-by-step format if appropriate\n   - For conceptual questions, provide definitions and explanations\n\n4. Include relevant details that could appear in an actual document, such as:\n   - Common terminology in the subject area\n   - Typical phrases or sentence structures used in formal writing\n   - Plausible data points or statistics (without inventing specific figures)\n\n5. Adjust the length and complexity of the answer based on the question:\n   - Provide brief, focused answers for simple questions\n   - Offer more detailed responses for complex queries\n\n6. If the question is ambiguous or could have multiple interpretations, generate an answer that addresses the most likely interpretation.\n\n7. For questions about current events or time-sensitive information, generate an answer that could be valid across a range of recent time periods.\n\n8. If the question asks for opinions or subjective information, generate a balanced response that could represent a consensus view.\n\nOutput Format:\nYou MUST provide your response in a valid JSON format with the following structure:\n{\n  "originalQuestion": "string (the original user question)",\n  "hypotheticalAnswer": "string (the generated hypothetical answer)",\n  "keyTerms": ["string", "string", ...],\n  "answerType": "string (one of: factual, procedural, conceptual, opinion-based, mixed)",\n  "confidenceLevel": "string (one of: high, medium, low)"\n}\n\nEnsure that your JSON output is properly formatted and contains all required fields. The hypotheticalAnswer should be a coherent paragraph or set of paragraphs. The keyTerms should be an array of important words or phrases from your answer. The answerType should reflect the primary nature of your response. The confidenceLevel should indicate your assessment of how well your answer matches likely real-world documents.\n\nDo not include any explanations or additional text outside of the JSON structure.',
} as GroqChatCompletionMessageParam;

const groqUser = (question: string) =>
  ({
    role: "user",
    content: `Generate a hypothetical answer for the following question, optimized for use in a Hypothetical Document Embedding (HyDE) system:\n\n"${question}"\n\nProvide your response in the specified JSON format, ensuring all required fields are included.`,
  }) as GroqChatCompletionMessageParam;

const groqModel = "llama-3.2-90b-text-preview";
const groqTemp = 0;
const groqTokens = 1024;
