import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { openai } from "~/utils/providers.server";

const MODEL = "gpt-4o-mini";

const system = {
  role: "system",
  content: [
    {
      type: "text",
      text: "You are an expert at analyzing chatbot responses. Your task is to determine if a chatbot APPROPRIATELY and FULLY responded to the user'''s message.\n\nGuidelines for determining if a message was properly answered:\n- For questions or requests for information:\n  - Messages like \"I don'''t know\", \"I'''m not sure\", \"I can'''t help with that\" = NOT answered\n  - Deflecting to customer support = NOT answered  \n  - Partial answers that don'''t address all parts of the question = NOT answered\n  - If multiple questions were asked, ALL must be answered to count as answered\n\n- For greetings, acknowledgments, or social messages:\n  - An appropriate social response counts as answered\n  - The response should match the type of message (greeting for greeting, etc.)\n\nFocus purely on whether the chatbot'''s response was appropriate and complete for the type of message received, ignoring the response'''s tone or style.",
    },
  ],
} as ChatCompletionMessageParam;

const user = ({
  history,
  query,
  answer,
}: {
  history: { role: "user" | "assistant"; content: string }[];
  query: string;
  answer: string;
}) =>
  ({
    role: "user",
    content: [
      {
        type: "text",
        text: `Analyze if the chatbot fully answered the user's query.\n\nPrevious chat context:\n${
          history.length > 2
            ? history
                .slice(-12, -2)
                .map((msg) => `${msg.role}: ${msg.content}`)
                .join("\n")
            : "n/a"
        }\n\nUser's question:\n${query}\n\nChatbot's response:\n${answer}\n\nAnalyze if the chatbot fully answered all aspects of the user's query. Return your analysis in the required JSON format.`,
      },
    ],
  }) as ChatCompletionMessageParam;

export const ChatResponseAnalysisSchema = z.object({
  answered_query: z
    .boolean()
    .describe(
      "Whether the chatbot fully answered ALL aspects of the user's question(s)",
    ),
  reasoning: z
    .string()
    .describe(
      "Clear explanation of why this was or wasn't considered a complete answer",
    ),
});

export async function call({
  history,
  query,
  answer,
}: {
  history: { role: "user" | "assistant"; content: string }[];
  query: string;
  answer: string;
}): Promise<z.infer<typeof ChatResponseAnalysisSchema> | null> {
  try {
    const completion = await openai.beta.chat.completions.parse(
      {
        model: MODEL,
        messages: [system, user({ history, query, answer })],
        response_format: zodResponseFormat(
          ChatResponseAnalysisSchema,
          "analysis",
        ),
        temperature: 0,
        max_tokens: 2048,
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
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
