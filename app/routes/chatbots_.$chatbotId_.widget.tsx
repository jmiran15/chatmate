import { useParams } from "@remix-run/react";
import { Send, Bot, Minimize, RefreshCw, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

export default function ChatbotWidget() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState<string>("");
  const { chatbotId } = useParams();
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);

  // on render, do all regular message stuff with pure state, on destroy, generate random uuid for the user and push the chat to the db
  useEffect(() => {
    console.log("mounting chat");
    return () => {
      console.log("unmounting chat");
    };
  }, []);

  console.log("messages", messages);

  async function sendMessage(input: string) {
    console.log("these are the messages: ", messages);

    if (input.trim() === "") {
      return;
    }

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
    console.log("response", data);

    if (!data) {
      return;
    }

    console.log("message: ", data.response.message);

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
          <div className="overflow-y-auto mb-3 p-3">
            <ScrollArea className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="">No messages yet</p>
              ) : (
                <div className="flex flex-col space-y-4">
                  {messages.map((message, index) => {
                    console.log("message", message, message.role === "user");
                    return (
                      <div
                        key={index}
                        className={cn(
                          "rounded-lg p-3 text-sm",
                          message.role === "user"
                            ? "ml-auto bg-primary text-white"
                            : "bg-gray-200 text-gray-700",
                        )}
                      >
                        {message.content}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
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
