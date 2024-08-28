import invariant from "tiny-invariant";
import { Queue } from "~/utils/queue.server";

export interface GenerateInsightsQueueData {
  chatId: string;
}

export interface GenerateInsightsQueueResult {
  aiInsights: string;
}

import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { openai } from "~/utils/providers.server";

const InsightType = z.enum([
  "user_intent",
  "user_emotion",
  "key_topic",
  "interaction_quality",
  "action_item",
]);
const SentimentType = z.enum(["positive", "neutral", "negative", "mixed"]);

const Insight = z.object({
  content: z
    .string()
    .describe("The insight content, limited to 100 characters."),
  type: InsightType.describe("The type of insight provided."),
  relevance_score: z
    .number()
    .describe(
      "A score from 1 to 10 indicating the relevance of this insight, with 10 being most relevant.",
    ),
});

export const ChatInsightsSchema = z.object({
  insights: z
    .array(Insight)
    .describe(
      "A list of key insights about the chat. Provide 1 to 5 insights. Insights should be in chronological order.",
    ),
  overall_sentiment: SentimentType.describe(
    "The overall sentiment of the chat based on the insights.",
  ),
  primary_user_intent: z
    .string()
    .describe(
      "A brief description (max 50 characters) of the primary intent of the user in this chat.",
    ),
});

export const generateAIInsights = Queue<GenerateInsightsQueueData>(
  "generateInsights",
  async (job): Promise<GenerateInsightsQueueResult> => {
    const childrenValues = await job.getChildrenValues();
    const chat = Object.values(childrenValues)[0];

    invariant(
      chat?.id === job.data.chatId,
      `Chat ID mismatch: ${chat?.id} !== ${job.data.chatId}`,
    );

    const formattedMessages = chat?.messages?.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

    const aiInsights: z.infer<typeof ChatInsightsSchema> | null =
      await generateInsights({
        messages: formattedMessages,
      });

    return {
      aiInsights: aiInsights
        ? aiInsights.insights.map((i) => i.content).join("\n")
        : "",
    };
  },
);

async function generateInsights({
  messages,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
}): Promise<z.infer<typeof ChatInsightsSchema> | null> {
  const lastMessages = messages.slice(-6);

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [systemPrompt, userPrompt({ messages: lastMessages })],
      response_format: zodResponseFormat(ChatInsightsSchema, "chat_insights"),
      temperature: 0.2,
      max_tokens: 256,
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

const systemPrompt = {
  role: "system",
  content: [
    {
      type: "text",
      text: "You are an AI designed to generate concise, relevant insights about user interactions with a chatbot. Your task is to analyze chat transcripts and provide key takeaways that would be valuable at a quick glance to the chatbot owner. Follow these guidelines:\n\n1. Generate 1 to 5 insights, depending on the chat's content and importance. Less is more!\n2. Each insight should be a single, concise sentence, no longer than 100 characters.\n3. Provide insights in chronological order of the messages.\n4. Categorize each insight into one of these types:\n   - user_intent: The user's goal or objective\n   - user_emotion: The user's emotional state or reaction\n   - key_topic: Important subjects discussed\n   - interaction_quality: How well the conversation is proceeding\n   - action_item: Necessary follow-ups or next steps\n5. Assign a relevance score (1-10) to each insight, with 10 being most relevant.\n6. Determine the overall sentiment of the chat (positive, neutral, negative, or mixed).\n7. Identify the primary user intent in 50 characters or less.\n\nFocus on:\n- User intents, behaviors, and emotions\n- Significant questions, concerns, or areas of interest\n- Patterns or recurring themes in user queries\n- Quality of interaction between user and chatbot\n\nPrioritize quality over quantity. If the chat is brief or uneventful, it's acceptable to provide fewer insights.\n\nThe insights should always be substantially shorter/fewer than the entire chat history. The ultimate purpose of the insights is for an owner to be able to take a glance and understand 80% of the entire chat history. The chat insights should never take nearly as much time to read/understand as the actual chat history - as that would defeat the entire purpose of the insights!\n\nDo not provide unnecessary insights. Every insight you provide must be crucial, otherwise it is to the detriment!\n\nYou will be rewarded (and scored) on your ability to provide as few insights as possible.\n\nOutput your response in the specified JSON format, adhering to the schema provided.",
    },
  ],
} as ChatCompletionMessageParam;

const userPrompt = ({
  messages,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
}) =>
  ({
    role: "user",
    content: [
      {
        text: `Chat transcript:\n${messages
          .map((message) => `${message.role}: ${message.content}`)
          .join(
            "\n",
          )}\nAnalyze this chat transcript and generate key insights following the guidelines provided. Remember:\n1. Provide 1 to 5 insights, each no longer than 100 characters.\n2. Categorize each insight and provide a relevance score.\n3. Determine the overall sentiment.\n4. Identify the primary user intent in 50 characters or less.\n\nFocus on the most important aspects of the user's interaction with the chatbot. Output your response in the specified JSON format.`,
        type: "text",
      },
    ],
  }) as ChatCompletionMessageParam;
