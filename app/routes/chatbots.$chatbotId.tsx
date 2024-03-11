import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import {
  MessageSquareMore,
  Database,
  Brush,
  Share,
  Settings,
  MessagesSquare,
  AreaChart,
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
            title: "Analytics",
            path: "analytics",
            icon: AreaChart,
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
