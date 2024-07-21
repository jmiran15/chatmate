import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import Sidebar from "~/components/layout/sidebar";
import { getChatbotById } from "~/models/chatbot.server";
import { requireUserId } from "~/session.server";
import type { Socket } from "socket.io-client";
import io from "socket.io-client";
import { SocketProvider } from "~/providers/socket";
import { useEffect, useState } from "react";
import { prisma } from "~/db.server";

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

  // TODO - parallelize + defer this
  const WHERE = {
    chatbotId,
    userId: null,
    deleted: false,
    messages: {
      some: {
        role: "user",
      },
    },
    seen: false,
  };
  const unseenChats = await prisma.chat.count({
    where: WHERE,
  });

  return { chatbot, unseenChats };
};

export default function ChatbotLayout() {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const socket = io();
    setSocket(socket);
    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("confirmation", (data) => {
      console.log(data);
    });
  }, [socket]);

  return (
    <SocketProvider socket={socket}>
      <div className="flex flex-col w-full h-full lg:grid lg:grid-cols-6 overflow-hidden">
        <Sidebar />
        <div className="grow lg:col-span-5 h-full overflow-hidden">
          <Outlet />
        </div>
      </div>
    </SocketProvider>
  );
}
