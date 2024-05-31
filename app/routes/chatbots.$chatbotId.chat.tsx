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
      const userMessage = formData.get("userMessage");

      console.log("userMessage", userMessage);

      const chat = await createChatWithStartersAndUser({ chatbotId, userId });
      return redirect(
        userMessage
          ? `/chatbots/${chatbotId}/chat/${chat.id}?userMessage=${String(
              userMessage,
            )}`
          : `/chatbots/${chatbotId}/chat/${chat.id}`,
      );
    }
    case "delete": {
      const chats = await getChatsByUserAndChatbotId({ chatbotId, userId });
      const deletedChatIndex = chats.findIndex((chat) => chat.id === chatId);

      const redirectChatId =
        deletedChatIndex > 0
          ? chats[deletedChatIndex - 1].id
          : chats.length > 1
          ? chats[deletedChatIndex + 1].id
          : "";
      await deleteChatByChatId({ chatId });
      return redirect(
        `/chatbots/${chatbotId}/chat${
          redirectChatId ? `/${redirectChatId}` : ""
        }`,
      );
    }
    case "update": {
      const chatName = formData.get("updateName") as string;
      return await updateChatName({ chatId, chatName });
    }

    default: {
      throw new Error("Invalid action type");
    }
  }
};

export default function Chat() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col-reverse md:grid md:grid-cols-5 h-full">
      <div className="md:col-span-4 h-full overflow-hidden">
        <Outlet />
      </div>
      <ChatsNav chats={data.chats} isCollapsed={false} />
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/chat`,
  breadcrumb: "chat",
};
