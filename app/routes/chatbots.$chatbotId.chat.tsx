import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import {
  createChatWithStartersAndUser,
  deleteChatByChatId,
  getChatsByUserAndChatbotId,
  updateChatName,
} from "~/models/chat.server";
import { requireUserId } from "~/session.server";
import { ChatsNav } from "~/components/chats-nav";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const chatbotId = params.chatbotId as string;
  const userId = await requireUserId(request);

  const chats = await getChatsByUserAndChatbotId({ chatbotId, userId });

  return json({ chats });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // switch action types: create new chat, delete chat, update chat name
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const chatId = formData.get("chatId") as string;
  const userId = await requireUserId(request);
  const chatbotId = params.chatbotId as string;

  switch (action) {
    case "create": {
      const chat = await createChatWithStartersAndUser({ chatbotId, userId });
      return redirect(chat.id);
    }
    case "delete": {
      await deleteChatByChatId({ chatId });
      return redirect(`/chatbots/${chatbotId}/chat`);
    }
    case "update": {
      const chatName = formData.get("updateName") as string;
      return await updateChatName({ chatId, chatName });
    }
  }
};

export default function Chat() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="grid grid-cols-5 h-full">
      <div className="col-span-4 h-full overflow-hidden">
        <Outlet />
      </div>
      <ChatsNav chats={data.chats} isCollapsed={false} />
    </div>
  );
}

export const handle = {
  breadcrumb: "chat",
};
