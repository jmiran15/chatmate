import { Form, Link, NavLink, useLocation, useMatches } from "@remix-run/react";

import { cn } from "~/lib/utils";
import { buttonVariants } from "./ui/button";
import { Separator } from "./ui/separator";
import { Chat } from "@prisma/client";
import ChatLink from "./chat-link";

interface NavProps {
  isCollapsed: boolean;
  chats: Chat[];
}

export function ChatsNav({ chats, isCollapsed }: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        <Form method="post">
          <input type="hidden" name="action" value="create" />
          <button className="block p-4 text-xl text-blue-500" type="submit">
            + New Chat
          </button>
        </Form>
        <Separator />
        {chats.length === 0 ? (
          <p className="p-4">No chats yet</p>
        ) : (
          chats.map(
            (chat) => !isCollapsed && <ChatLink key={chat.id} chat={chat} />,
          )
        )}
      </nav>
    </div>
  );
}

{
  /* <div className="h-full w-80 border-r bg-gray-50">
  {data.chats.length === 0 ? (
    <p className="p-4">No chats yet</p>
  ) : (
    <ol>
      {data.chats.map((chat) => (
        <li
          key={chat.id}
          className={"flex flex-row justify-between border-b p-4 text-xl"}
        >
          <NavLink
            className={({ isActive }) =>
              ` p-4 text-xl ${isActive ? "bg-white" : ""}`
            }
            to={chat.id}
          >
            {chat.name}
          </NavLink>
         
        </li>
      ))}
    </ol>
  )}
</div>; */
}
