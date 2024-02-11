import { RefreshCw, Send, X } from "lucide-react";
import Messages from "./messages";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const messages = [
  {
    role: "agent",
    content: "Hi, how can I help you today?",
  },
  {
    role: "user",
    content: "Hey, I'm having trouble with my account.",
  },
  {
    role: "agent",
    content: "What seems to be the problem?",
  },
  {
    role: "user",
    content: "I can't log in.",
  },
];

export default function DeadChat({
  color,
  radius,
  name,
}: {
  color: string;
  radius: number;
  name: string;
}) {
  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-2xl justify-between">
      <div>
        <div
          className="flex items-center justify-between p-5 rounded-t-2xl"
          style={{
            backgroundColor: color,
            // borderTopLeftRadius: `${radius}rem`,
            // borderTopRightRadius: `${radius}rem`,
          }}
        >
          <div className="flex items-center">
            <img
              src="https://s3-alpha.figma.com/hub/file/1913095808/a7bdc469-cd70-4ea1-bb57-b59204ad8182-cover.png"
              alt="Chatmate"
              className="h-6 w-6 rounded-full mr-2"
            />
            <span className="text-white font-medium">{name}</span>
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
            <button className="text-white hover:text-opacity-80 transition ease-in-out duration-150 ml-2">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* messages */}
        <Messages
          messages={messages}
          loading={false}
          color={color}
          radius={radius}
        />
      </div>
      {/* input */}
      <div className="flex flex-row items-center justify-between gap-2 p-3">
        <Input
          placeholder="Type your message..."
          className="flex-1"
          autoComplete="off"
          type="text"
          name="message"
        />
        <Button
          type="submit"
          size="icon"
          style={{
            borderRadius: `${radius}rem`,
            backgroundColor: color,
          }}
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
}
