// // this page /chatbots shows a list of your chatbots and has a button that takes you to /chatbots/new where you can create a new chatbot
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import ChatbotCard from "~/components/chatbot-card";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

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
    <div className="flex flex-col gap-8 w-full py-12 px-8 md:px-20 xl:px-96">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-2xl font-bold leading-tight tracking-tighter">
          Chatbots
        </h1>

        <Link to="new" className={cn(buttonVariants(), "self-end")}>
          + New Chatbot
        </Link>
      </div>

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
