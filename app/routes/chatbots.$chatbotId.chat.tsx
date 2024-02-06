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
} from "~/models/chat.server";
import { requireUserId } from "~/session.server";

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
    case "delete":
      console.log("deleting chat", chatId);
      await deleteChatByChatId({ chatId });
      return redirect(`/chatbots/${chatbotId}/chat`);
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
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsible={false}
        // minSize={15}
        // maxSize={20}
      >
        <Outlet />
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]}>
        <div className="h-full w-80 border-r bg-gray-50">
          <Form method="post">
            <input type="hidden" name="action" value="create" />
            <button className="block p-4 text-xl text-blue-500" type="submit">
              + New Chat
            </button>
          </Form>

          <hr />

          {data.chats.length === 0 ? (
            <p className="p-4">No chats yet</p>
          ) : (
            <ol>
              {data.chats.map((chat) => (
                <li
                  key={chat.id}
                  className={
                    "flex flex-row justify-between border-b p-4 text-xl"
                  }
                >
                  <NavLink
                    className={({ isActive }) =>
                      ` p-4 text-xl ${isActive ? "bg-white" : ""}`
                    }
                    to={chat.id}
                  >
                    {chat.name}
                  </NavLink>
                  <Form method="post">
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="chatId" value={chat.id} />
                    <button type="submit">🗑️</button>
                  </Form>
                </li>
              ))}
            </ol>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export const handle = {
  breadcrumb: "chat",
};
