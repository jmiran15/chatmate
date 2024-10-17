import { hpf, hpstatic } from "@helicone/prompts";
// import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions.mjs";
import { groq } from "../providers.server";

const MODEL = "gpt-4o-mini";
const GROQ_MODEL = "llama-3.2-90b-text-preview";
const MAX_TOKENS = 1024;

const HyDESystemPrompt = {
  role: "system",
  content: hpstatic`You are an advanced AI assistant specialized in generating hypothetical answers for a Hypothetical Document Embedding (HyDE) system within a Retrieval Augmented Generation (RAG) framework. Your task is to create plausible, relevant answers to user questions that could potentially match actual document content in a vector database.\n\nFollow these guidelines to generate optimal hypothetical answers:\n\n1. Analyze the user's question thoroughly, understanding its main points, implicit context, and the type of information being sought.\n\n2. Generate a hypothetical answer that:\n   - Is directly relevant to the question\n   - Contains key terms and concepts likely to appear in actual documents\n   - Balances specificity with generality to maximize potential matches\n   - Maintains a neutral, informative tone\n   - Avoids introducing speculative or potentially false information\n\n3. Structure the answer in a way that mimics how it might appear in a real document:\n   - For factual questions, present information clearly and concisely\n   - For procedural questions, use a step-by-step format if appropriate\n   - For conceptual questions, provide definitions and explanations\n\n4. Include relevant details that could appear in an actual document, such as:\n   - Common terminology in the subject area\n   - Typical phrases or sentence structures used in formal writing\n   - Plausible data points or statistics (without inventing specific figures)\n\n5. Adjust the length and complexity of the answer based on the question:\n   - Provide brief, focused answers for simple questions\n   - Offer more detailed responses for complex queries\n\n6. If the question is ambiguous or could have multiple interpretations, generate an answer that addresses the most likely interpretation.\n\n7. For questions about current events or time-sensitive information, generate an answer that could be valid across a range of recent time periods.\n\n8. If the question asks for opinions or subjective information, generate a balanced response that could represent a consensus view.\n\nRemember, the goal is to create a hypothetical answer that is likely to have high vector similarity with actual relevant documents in the database, thereby improving the retrieval process in the RAG system.`,
} as ChatCompletionMessageParam;

const HyDEUserPrompt = (question: string) =>
  ({
    role: "user",
    content: hpf`Generate a hypothetical answer to the following question. This answer should be plausible and structured as if it were extracted from a relevant document, optimized for use in a Hypothetical Document Embedding (HyDE) system.\n\nUser Question: ${{
      question,
    }}\n\nPlease provide only the hypothetical answer, no other text. Ensure that your hypothetical answer is relevant, informative, and likely to match the content and style of actual documents addressing this topic.`,
  }) as ChatCompletionMessageParam;

// export const HyDEGenerationSchema = z.object({
//   originalQuestion: z.string().describe("The original user question"),
//   hypotheticalAnswer: z.string().describe("The generated hypothetical answer"),
//   keyTerms: z
//     .array(z.string())
//     .describe("Important terms or concepts used in the hypothetical answer"),
//   answerType: z
//     .enum(["factual", "procedural", "conceptual", "opinion-based", "mixed"])
//     .describe("The primary type of information provided in the answer"),
//   confidenceLevel: z
//     .enum(["high", "medium", "low"])
//     .describe(
//       "Estimated confidence in the relevance and accuracy of the hypothetical answer",
//     ),
// });

export async function generateHyDE({
  originalQuery,
  sessionId,
  chatName,
}: {
  originalQuery: string;
  sessionId: string;
  chatName: string;
  // }): Promise<z.infer<typeof HyDEGenerationSchema> | null> {
}): Promise<string | null> {
  try {
    const completion = await groq.chat.completions.create(
      {
        model: GROQ_MODEL,
        messages: [HyDESystemPrompt, HyDEUserPrompt(originalQuery)],
        temperature: 0,
        max_tokens: MAX_TOKENS,
      },
      // {
      //   headers: {
      //     "Helicone-Property-Environment": process.env.NODE_ENV,
      //     "Helicone-Session-Id": sessionId,
      //     "Helicone-Session-Path": "/message/hyde",
      //     "Helicone-Session-Name": chatName,
      //     "Helicone-Prompt-Id": "chat_hyde",
      //   },
      // },
    );

    const result = completion.choices[0]?.message?.content;
    console.log("HyDE result: ", result);
    return result;
  } catch (e) {
    console.log("Error generating HyDE: ", e);
    // if ((e as Error).constructor.name == "LengthFinishReasonError") {
    //   // Retry with a higher max tokens
    //   console.log("Too many tokens: ", (e as Error).message);
    // } else {
    //   // Handle other exceptions
    //   console.log("An error occurred: ", (e as Error).message);
    // }
  }
  return null;
}
