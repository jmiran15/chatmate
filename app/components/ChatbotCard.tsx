import { Chatbot } from "@prisma/client";
import { Link } from "@remix-run/react";

export default function ChatbotCard({ chatbot }: { chatbot: Chatbot }) {
  return (
    <Link
      to={chatbot.id}
      className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-slate-50 "
    >
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {chatbot.name}
      </h5>
      <p className="font-normal text-gray-700 dark:text-gray-400">
        {chatbot.description}
      </p>
    </Link>
  );
}
