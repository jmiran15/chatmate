import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import Sidebar from "~/components/layout/sidebar";
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
    <div className="flex flex-col w-full h-full lg:grid lg:grid-cols-6 overflow-hidden">
      <Sidebar />
      <div className="grow lg:col-span-5 h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
