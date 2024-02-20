import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ChatbotCard from "~/components/chatbot-card";
import { getAllChatbots } from "~/models/chatbot.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  // jmiran15@jhu.edu
  if (userId !== "47ea213c-227a-42f4-9a91-b1ac4580330f") {
    return redirect("/chatbots");
  }

  const chatbots = await getAllChatbots();

  return json({ chatbots });
};

export default function Admin() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-8 w-full py-12 px-8 md:px-20 xl:px-96">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-2xl font-bold leading-tight tracking-tighter">
          All chatbots
        </h1>
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
