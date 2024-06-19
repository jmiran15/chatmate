import { openai } from "~/utils/providers.server";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { follow_up_system_prompt } from "~/utils/prompts";

export async function loader() {
  console.log("loader");
  const headers = {
    "Access-Control-Allow-Origin": "*", // Allow any domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  return json({ headers });
}

export async function action({ request }: ActionFunctionArgs) {
  // data is coming in as json not formdata

  const body = JSON.parse(await request.text());
  const { history } = body;

  if (!history) {
    return json(
      { error: "History required to generate follow ups" },
      { status: 404 },
    );
  }

  const followUps = await generateFollowUps(history);

  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*", // Allow any domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  console.log(
    "followUps",
    followUps.replace(/^"(.*)"$/, "$1"),
    followUps.replace(/^"(.*)"$/, "$1").length
      ? followUps.split("\n").map((followUp: string) => followUp.trim())
      : [],
  );

  return json(
    {
      followUps: followUps.replace(/^"(.*)"$/, "$1").length
        ? followUps.split("\n").map((followUp: string) => followUp.trim())
        : [],
    },
    { headers },
  );
}

// switch to groq for lower lat
async function generateFollowUps(
  chat_history: {
    role: "user" | "assistant";
    content: string;
  }[],
): Promise<string> {
  // get the last 4 messages from the chat history
  const lastMessages = chat_history.slice(-4);

  const history =
    "BEGIN CHAT HISTORY\n" +
    lastMessages
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n") +
    "END CHAT HISTORY\n\n";
  const user_prompt =
    history +
    "POSSIBLE FOLLOW UP QUESTIONS (separated by new line, min 0, max 3)";

  // const completion = await groq.chat.completions.create({
  //   messages: [
  //     {
  //       role: "system",
  //       content: follow_up_system_prompt,
  //     },
  //     {
  //       role: "user",
  //       content: user_prompt,
  //     },
  //   ],
  //   model: "mixtral-8x7b-32768",
  // });
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: follow_up_system_prompt,
      },
      {
        role: "user",
        content: user_prompt,
      },
    ],
    model: "gpt-4-0125-preview",
  });

  return completion.choices[0].message.content as string;
}
