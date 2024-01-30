// // this page /chatbots shows a list of your chatbots and has a button that takes you to /chatbots/new where you can create a new chatbot
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import ChatbotCard from "~/components/ChatbotCard";

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
    <div className="flex flex-col gap-2 w-full px-24 py-12">
      <h1 className="text-2xl font-bold">My Chatbots</h1>
      <Link
        to="new"
        className="flex items-center justify-center rounded-md bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600 self-end"
      >
        + New Chatbot
      </Link>

      {data.chatbots.length === 0 ? (
        <p className="p-4">No chatbots yet</p>
      ) : (
        <ol className="space-y-4 ">
          {data.chatbots.map((chatbot) => (
            <li key={chatbot.id}>
              <ChatbotCard chatbot={chatbot} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
