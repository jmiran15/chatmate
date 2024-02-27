// this is a layout, not page. it is the layout for all routers -> chatbots/:id ...
// it has a sidebar with "Chat", "Model", etc...

// this is AUTH PROTECTED!, I.E. IN THE LOADER CHECK IF WE HAVE USER IF NOT SEND BACK TO HOME
// in the loader we should also load the chatbot. This should refresh everytime a change is made to the chatbot (i.e. components)?????
// maybe not, since chatbots have chats, and dont want to refresh everytime a change to chats

import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import {
  MessageSquareMore,
  Database,
  Brush,
  Share,
  Settings,
  MessagesSquare,
} from "lucide-react";

import { Nav } from "~/components/nav";
import { getChatbotById } from "~/models/chatbot.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { chatbotId } = params;
  const userId = await requireUserId(request);
  const chatbot = await getChatbotById({ id: chatbotId });
  if (
    chatbot?.userId !== userId &&
    userId !== "47ea213c-227a-42f4-9a91-b1ac4580330f"
  ) {
    return redirect("/chatbots");
  }
  return { chatbot };
};

export default function ChatbotLayout() {
  return (
    <div className="flex flex-col md:grid md:grid-cols-6 w-full h-full overflow-hidden">
      <Nav
        links={[
          {
            title: "Chat",
            path: "chat",
            icon: MessageSquareMore,
          },
          {
            title: "Data",
            path: "data",
            icon: Database,
          },
          {
            title: "Appearance",
            path: "appearance",
            icon: Brush,
          },
          {
            title: "Share",
            path: "share",
            icon: Share,
          },
          {
            title: "Chats",
            path: "chats",
            icon: MessagesSquare,
          },
          {
            title: "Settings",
            path: "settings",
            icon: Settings,
          },
        ]}
      />
      <div className="grow md:col-span-5 h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
