// chatbots/id/chat ...
// this is a layout route
// it has a sidebar to the right (same type as the one on the left), with a list of chats
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";

import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Form, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import {
  createChatWithUser,
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

  console.log("action", action);

  switch (action) {
    case "create": {
      const chat = await createChatWithUser({ chatbotId, userId });
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

export default function Chat({
  defaultLayout = [1095, 265],
}: {
  defaultLayout?: number[] | undefined;
}) {
  const data = useLoaderData<typeof loader>();

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        console.log("set cookies to save");
      }}
      className="h-full max-h-[800px] items-stretch"
    >
      <ResizablePanel defaultSize={defaultLayout[0]} collapsible={false}>
        <Outlet />
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]}>
        <ChatsNav chats={data.chats} isCollapsed={false} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export const handle = {
  breadcrumb: "chat",
};
