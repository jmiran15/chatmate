import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { prisma } from "~/db.server";
import { SidebarWidthProvider } from "~/providers/sidebarWidth";
import { SocketProvider } from "~/providers/socket";
import { requireUserId } from "~/session.server";
import Sidebar from "./sidebar";

// jmiran15@jhu.edu
const adminUserId = "47ea213c-227a-42f4-9a91-b1ac4580330f";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  if (chatbot?.userId !== userId && userId !== adminUserId) {
    return redirect("/chatbots");
  }

  // TODO - defer
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

  return json({ chatbot, unseenChats });
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
      <SidebarWidthProvider>
        <div className="flex flex-col w-full h-full lg:grid lg:grid-cols-6 overflow-hidden">
          <Sidebar />
          <div className="grow lg:col-span-5 h-full overflow-hidden">
            <Outlet />
          </div>
        </div>
      </SidebarWidthProvider>
    </SocketProvider>
  );
}
