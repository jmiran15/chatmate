// // this page /chatbots shows a list of your chatbots and has a button that takes you to /chatbots/new where you can create a new chatbot

import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { getChatbotsByUserId } from "~/models/chatbot.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const chatbots = await getChatbotsByUserId({ userId });
  return json({ chatbots });
};

export default function MyChatbots() {
  const data = useLoaderData<typeof loader>();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <h1>My Chatbots</h1>
      <Link
        to="new"
        className="flex items-center justify-center rounded-md bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600"
      >
        + New Chatbot
      </Link>

      {data.chatbots.length === 0 ? (
        <p className="p-4">No chatbots yet</p>
      ) : (
        <ol>
          {data.chatbots.map((chatbot) => (
            <li key={chatbot.id}>
              <ChatbotCard chatbot={{ id: chatbot.id, name: chatbot.name }} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ChatbotCard({ chatbot }: { chatbot: { id: string; name: string } }) {
  return <Link to={chatbot.id}>{chatbot.name}</Link>;
}
