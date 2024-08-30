import { Chat, Chatbot, Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useNavigate, useParams, useSearchParams } from "@remix-run/react";
import { AnimatePresence } from "framer-motion";
import Modal from "~/components/custom-mobile-modal";
import Thread from "./thread/thread";

export default function MobileThread({
  thread,
  chat,
  chatbot,
}: {
  thread: SerializeFrom<Message[]>;
  chat: SerializeFrom<Chat>;
  chatbot: SerializeFrom<Chatbot>;
}) {
  const navigate = useNavigate();
  const { chatbotId } = useParams();
  const [searchParams] = useSearchParams();

  function handleExitComplete() {
    navigate(`/chatbots/${chatbotId}/chats?${searchParams.toString()}`);
  }
  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      <Modal title={`${chatbot.name} Chat`} onDismiss={handleExitComplete}>
        <div className="h-[80vh] overflow-y-auto">
          <Thread
            thread={thread}
            seen={chat?.seen}
            scrollThreadToBottom={() => {}}
          />
        </div>
      </Modal>
    </AnimatePresence>
  );
}
