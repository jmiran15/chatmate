import { useParams } from "@remix-run/react";
import { Send, Bot, Minimize, RefreshCw, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import Messages from "~/components/messages";

export default function ChatbotWidget() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState<string>("");
  const { chatbotId } = useParams();
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // useEffect(() => {
  //   console.log("mounting chat");
  //   return () => {
  //     console.log("unmounting chat");
  //   };
  // }, []);

  async function sendMessage(input: string) {
    if (input.trim() === "") {
      return;
    }

    setIsSubmitting(true);

    const santizedInput = input.trim();
    const inputMessage = {
      role: "user",
      content: santizedInput,
    } as { role: "user" | "assistant"; content: string };

    const newMessages = [...messages, inputMessage];
    setMessages(newMessages);

    if (!chatbotId) {
      throw new Error("No chatbotId");
    }

    const response = await fetch(`/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: newMessages, chatbotId }),
    });

    const data = await response.json();

    if (!data) {
      return;
    }

    setIsSubmitting(false);

    setMessages([...newMessages, data.response.message]);
  }

  return (
    <div className="fixed bottom-2 right-2 p-4 z-50">
      <div
        className={`chat-interface flex flex-col justify-between absolute h-[90vh] md:h-[80vh] w-[95vw] md:w-[28vw] bg-white rounded-2xl shadow-sm overflow-hidden bottom-full right-4 mb-2
                  transition ease-in-out duration-300 ${
                    isChatVisible ? "opacity-100" : "opacity-0 invisible"
                  }`}
      >
        {/* Chat Header */}
        <div>
          <div className="flex items-center justify-between bg-indigo-500 p-5 rounded-t-2xl">
            <div className="flex items-center">
              <img
                src="https://s3-alpha.figma.com/hub/file/1913095808/a7bdc469-cd70-4ea1-bb57-b59204ad8182-cover.png"
                alt="Chatmate"
                className="h-6 w-6 rounded-full mr-2"
              />
              <span className="text-white font-medium">Chatmate</span>
            </div>
            <div className="flex items-center">
              <button
                className="text-white hover:text-opacity-80 transition ease-in-out duration-150"
                onClick={() => {
                  /* reset action */
                }}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                className="text-white hover:text-opacity-80 transition ease-in-out duration-150 ml-2"
                onClick={() => setIsChatVisible(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* messages */}
          <Messages messages={messages} loading={isSubmitting} />
        </div>
        {/* input */}
        <div className="flex flex-row items-center justify-between gap-2 p-3">
          <Input
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
            type="text"
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-blue-500 hover:bg-blue-400 active:bg-blue-600"
            onClick={() => sendMessage(input)}
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
      <button
        className="bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-400 transition duration-300 transform hover:scale-110 p-3 rounded-full overflow-hidden border-none cursor-pointer"
        onClick={() => setIsChatVisible(!isChatVisible)}
      >
        {isChatVisible ? (
          <Minimize className="h-8 w-8 text-white" />
        ) : (
          <Bot className="h-8 w-8 text-white" />
        )}
      </button>
    </div>
  );
}
