import { AnimatePresence } from "framer-motion";
import Modal from "~/components/custom-mobile-modal";
import Thread from "./thread";
import { Chat, Chatbot, Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useNavigate, useParams, useSearchParams } from "@remix-run/react";

export default function MobileThread({
  thread,
  setThread,
  chat,
  chatbot,
}: {
  thread: SerializeFrom<Message[]>;
  setThread: (thread: SerializeFrom<Message[]>) => void;
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
            setThread={setThread}
            sessionId={chat?.sessionId}
            seen={chat?.seen}
          />
        </div>
      </Modal>
    </AnimatePresence>
  );
}
