import { Form } from "@remix-run/react";

import { Button } from "./ui/button";
import { Chat } from "@prisma/client";
import ChatLink from "./chat-link";
import { Plus } from "lucide-react";

interface NavProps {
  isCollapsed: boolean;
  chats: Chat[];
}

export function ChatsNav({ chats, isCollapsed }: NavProps) {
  return (
    <div className="col-span-1 flex flex-col gap-1 p-2 border-l border-gray-200">
      <Form method="post" className="w-full ">
        <input type="hidden" name="action" value="create" />
        <Button type="submit" className="w-full" variant={"outline"}>
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </Form>
      {chats.length === 0 ? (
        <p className="p-4">No chats yet</p>
      ) : (
        chats.map(
          (chat) => !isCollapsed && <ChatLink key={chat.id} chat={chat} />,
        )
      )}
    </div>
  );
}
