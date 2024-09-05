import { ActionFunctionArgs, json } from "@remix-run/node";
import { zodResponseFormat } from "openai/helpers/zod";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { openai } from "~/utils/providers.server";

const FollowUpQuestion = z.object({
  question: z.string().describe("The follow-up question text (max 50 chars)"),
  relevance: z
    .number()
    .int()
    .describe("Relevance score of the question (1-10)"),
});

const FollowUpQuestions = z.object({
  questions: z
    .array(FollowUpQuestion)
    .describe("Array of follow-up questions, maximum of 2"),
  no_questions_needed: z
    .boolean()
    .describe("Flag indicating if no follow-up questions are necessary"),
});

export async function loader() {
  const corsHeader =
    process.env.NODE_ENV === "production"
      ? {
          "Access-Control-Allow-Origin": "*",
        }
      : {};
  const headers = {
    ...corsHeader,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as HeadersInit;
  return json({ success: true }, { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const { history } = await request.json();

  if (!Array.isArray(history) || history.length === 0) {
    throw new Error("History must be a non-empty array to generate follow-ups");
  }

  const followUps: z.infer<typeof FollowUpQuestions> | null =
    await generateFollowUps(history);

  const corsHeader =
    process.env.NODE_ENV === "production"
      ? {
          "Access-Control-Allow-Origin": "*",
        }
      : {};
  const headers = {
    ...corsHeader,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as HeadersInit;

  return json(
    {
      followUps:
        followUps && !followUps.no_questions_needed
          ? followUps.questions.map((q) => q.question)
          : [],
    },
    { headers },
  );
}

async function generateFollowUps(
  messages: {
    role: "user" | "assistant";
    content: string;
  }[],
): Promise<z.infer<typeof FollowUpQuestions> | null> {
  const lastMessages = messages.slice(-6);

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        followUpSystemPrompt,
        followUpUserPrompt({ messages: lastMessages }),
      ],
      response_format: zodResponseFormat(
        FollowUpQuestions,
        "follow_up_questions",
      ),
      max_tokens: 512,
    });

    const result = completion.choices[0].message;

    if (result.parsed) {
      return result.parsed;
    } else if (result.refusal) {
      return null;
    }
  } catch (e) {
    if (e.constructor.name == "LengthFinishReasonError") {
      // Retry with a higher max tokens
      console.log("Too many tokens: ", e.message);
    } else {
      // Handle other exceptions
      console.log("An error occurred: ", e.message);
    }
  }
  return null;
}

function formatMessages(
  messages: { role: "user" | "assistant"; content: string }[],
) {
  return messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
}

const followUpSystemPrompt = {
  role: "system",
  content: [
    {
      type: "text",
      text: "You are a follow-up question generator for a website chatbot. Your goal is to predict and suggest the most likely next question a website visitor might ask based on their current conversation. Follow these guidelines:\n\n1. Analyze the chat history carefully.\n2. Generate up to 2 short, relevant follow-up questions that a website visitor is likely to ask next.\n3. Questions must be 50 characters or less.\n4. Focus on practical, immediate concerns a website visitor might have.\n5. Only suggest questions if they are highly likely to be useful to the user.\n6. Assign a relevance score (1-10) to each question.\n\nKey points to remember:\n- Prioritize questions about products, services, pricing, or immediate user needs.\n- Avoid general informational questions unless directly related to the user's inquiry.\n- If the conversation seems complete or no follow-up is necessary, set no_questions_needed to true.\n- Quality over quantity: It's better to suggest one highly relevant question or none at all than to force irrelevant options.\n\nYour output must strictly adhere to the provided JSON schema.",
    },
  ],
} as ChatCompletionMessageParam;

const followUpUserPrompt = ({
  messages,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
}) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: `CHAT HISTORY:\n${formatMessages(
          messages,
        )}\nWEBSITE CONTEXT: This chatbot is embedded on a third-party website to assist visitors with inquiries about the website's products or services.\n\nBased on this chat history and context, generate follow-up questions that a website visitor is most likely to ask next. Use the specified JSON schema and keep questions under 50 characters. Only suggest questions if they are highly relevant and likely to be clicked by the user.`,
      },
    ],
  }) as ChatCompletionMessageParam;
