import TestChatbotIndex from "~/components/indexes/test-chatbot";

export default function ChatIndex() {
  return (
    <div className="h-full w-full flex flex-col items-center md:justify-center justify-start p-4 lg:p-6 overflow-y-auto">
      <TestChatbotIndex />
    </div>
  );
}
