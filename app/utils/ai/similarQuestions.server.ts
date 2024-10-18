import { hpf, hpstatic } from "@helicone/prompts";

// TODO: add Helicon session tracking and prompt versioning
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { openai } from "~/utils/providers.server";

const MODEL = "gpt-4o-mini";

const QuestionSchema = z.object({
  question: z
    .string()
    .describe("A semantically similar question to the base question"),
  type: z
    .enum(["yes_no", "open_ended", "multiple_choice", "clarification"])
    .describe("The type of question generated"),
  perspective: z
    .enum(["customer", "employee", "partner", "general"])
    .describe("The perspective from which the question is asked"),
});

const GeneratedQuestionsSchema = z.object({
  generatedQuestions: z.array(QuestionSchema),
});

const similarQuestionsSystemPrompt = {
  role: "system",
  content: [
    {
      text: hpstatic`You are an AI assistant specialized in generating semantically similar questions for a Retrieval Augmented Generation (RAG) system. Your task is to create a diverse and comprehensive set of questions that could be answered by the same information as the original question-answer pair provided. Follow these guidelines:\n\n1. Analyze the base question and answer thoroughly to understand the core information, context, and implicit details.\n\n2. Generate a wide variety of questions (at least 20) that seek the same information but are phrased differently. Consider:\n   - Different levels of specificity (very general to highly specific)\n   - Various perspectives (e.g., primary stakeholder, secondary stakeholders, general public)\n   - Different tones (formal, casual, technical, simple)\n   - Direct and indirect ways of asking for the same information\n   - Questions of varying lengths (from very concise to more detailed)\n\n3. Ensure each generated question can be answered by the base answer. If the base answer lacks certain details, it's okay to generate relevant questions that highlight these information gaps.\n\n4. Avoid repetition. Each question should be unique in its phrasing, approach, or focus.\n\n5. Include a mix of question types:\n   - Yes/No questions\n   - Open-ended questions\n   - Multiple-choice style questions\n   - Clarification questions\n   - Comparative questions (relating the topic to similar concepts or entities)\n\n6. Use diverse terminology, including:\n   - Synonyms and related terms from the domain\n   - Both technical and layman's terms\n   - Acronyms and their full forms (where applicable)\n\n7. Address potential misunderstandings or unclear aspects of the base question by creating questions that clarify these points.\n\n8. Include questions about:\n   - The main topic\n   - Related processes or procedures\n   - Timelines or deadlines (if relevant)\n   - Exceptions or special cases\n   - Comparative aspects (how the subject compares to alternatives)\n   - Specific requirements or criteria\n   - Different modes or methods (if applicable)\n   - Statistical or quantitative aspects (if relevant)\n   - Broader implications or importance of the topic\n\n9. Consider questions from different user types (e.g., novices, experts, various roles) and their potential knowledge levels.\n\n10. Generate questions that might be asked at different stages of a user's journey or process related to the topic.\n\n11. Include some questions that combine multiple aspects of the topic to create more complex queries.\n\nRemember, the goal is to create a diverse set of questions that will enhance the RAG system's ability to match a wide range of potential user queries to the appropriate answer. Think broadly and creatively to capture as many potential ways of asking for this information as possible.`,
      type: "text",
    },
  ],
} as ChatCompletionMessageParam;

const similarQuestionsUserPrompt = ({
  baseQuestion,
  baseAnswer,
}: {
  baseQuestion: string;
  baseAnswer: string;
}) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: hpf`Given the following base question and answer, generate a list of semantically similar questions that could be answered by the same information:\n\nBase Question: ${{
          baseQuestion,
        }}\n\nBase Answer: ${{
          baseAnswer,
        }}\n\nPlease provide a numbered list of alternative questions, following the guidelines outlined in the system prompt. Ensure that your generated questions are diverse, comprehensive, and tailored to the specific topic of the base question and answer. Consider all potential angles and user perspectives related to this topic.`,
      },
    ],
  }) as ChatCompletionMessageParam;

// TODO: track these requests and prompts in Helicone
export async function generateSimilarQuestions({
  baseQuestion,
  baseAnswer,
  sessionId,
}: {
  baseQuestion: string;
  baseAnswer: string;
  sessionId?: string;
}): Promise<z.infer<typeof GeneratedQuestionsSchema> | null> {
  try {
    const completion = await openai.beta.chat.completions.parse(
      {
        model: MODEL,
        messages: [
          similarQuestionsSystemPrompt,
          similarQuestionsUserPrompt({ baseQuestion, baseAnswer }),
        ],
        response_format: zodResponseFormat(
          GeneratedQuestionsSchema,
          "generated_questions",
        ),
        temperature: 0,
        max_tokens: 2048,
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
          ...(sessionId && {
            "Helicone-Session-Id": sessionId,
            "Helicone-Session-Path": "/ingestion/similar_questions",
            "Helicone-Session-Name": baseQuestion,
            "Helicone-Prompt-Id": "qa_ingestion_similar_questions",
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
    if ((e as Error).constructor.name === "LengthFinishReasonError") {
      // Retry with a higher max tokens
      console.log("Too many tokens: ", (e as Error).message);
    } else {
      // Handle other exceptions
      console.log("An error occurred: ", (e as Error).message);
    }
  }
  return null;
}
