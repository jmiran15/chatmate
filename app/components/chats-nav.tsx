import { Form, useParams } from "@remix-run/react";

import { Button } from "./ui/button";
import { Chat } from "@prisma/client";
import ChatLink from "./chat-link";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";

interface NavProps {
  isCollapsed: boolean;
  chats: Chat[];
}

export function ChatsNav({ chats, isCollapsed }: NavProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const params = useParams();

  return (
    <>
      {/* mobile */}

      {/* like the nav, have the name of the active chat on left, and button (outline) to open drawer of chats on right */}
      {/* mobile */}
      <span className="md:hidden container h-14 px-6 py-6 w-screen flex justify-between items-center">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <p className="text-xl">
            {params.chatId
              ? chats.find((chat) => chat.id === params.chatId)?.name
              : "No chat selected"}
          </p>
          <SheetTrigger>
            <Button variant={"outline"} onClick={() => setIsOpen(true)}>
              View Chats
            </Button>
          </SheetTrigger>

          <SheetContent side={"right"} className="flex flex-col gap-4 px-4">
            <Form method="post" className="w-full pt-12">
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
                (chat) =>
                  !isCollapsed && <ChatLink key={chat.id} chat={chat} />,
              )
            )}
          </SheetContent>
        </Sheet>
      </span>

      {/* desktop */}
      <div className="hidden md:flex col-span-1 shrink-0 flex-col gap-1 p-2 border-l overflow-x-hidden overflow-y-auto">
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
    </>
  );
}
