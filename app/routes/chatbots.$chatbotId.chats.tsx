import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import ChatsCard from "~/components/chats-card";
import { getChatsByChatbotId } from "~/models/chat.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { chatbotId } = params;
  const userId = await requireUserId(request);

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const chats = await getChatsByChatbotId({ chatbotId });

  return json({ chats });
};

export default function Chats() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-10 h-full overflow-y-auto">
      <div className="max-h-screen lg:col-span-4 lg:h-full lg:max-h-full lg:overflow-y-auto flex flex-col items-center justify-start gap-4 lg:border-r border-b border-gray-200 p-8">
        {data.chats.length === 0 ? (
          <p className="p-4 self-start">
            Your chatbot has no chats yet. Embed it on your website with the
            code in the share tab and watch your chats come in. All chats with
            more than 1 user message will have AI generated insights.
          </p>
        ) : (
          <ol className="w-full space-y-4">
            {data.chats.map((chat) => (
              <li key={chat.id}>
                <ChatsCard chat={chat} />
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="col-span-6 lg:overflow-y-auto h-full">
        <Outlet />
      </div>
    </div>
  );
}
export const handle = {
  breadcrumb: "chats",
};
