import { Form } from "@remix-run/react";
import { useState } from "react";
import Customizer from "~/components/theme-customizer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Send } from "lucide-react";

import { Input } from "~/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { cn } from "~/lib/utils";

export default function Appearance({
  defaultLayout = [50, 50],
}: {
  defaultLayout?: number[] | undefined;
}) {
  const [messages, setMessages] = useState([
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
  ]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        console.log("set cookies to save");
      }}
      className="h-full max-h-[800px] items-stretch"
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsible={false}
        // minSize={15}
        // maxSize={20}
      >
        <Customizer />
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} className="p-6">
        <>
          <Card>
            <CardContent className="flex flex-row items-center">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Form
                method="post"
                className="flex w-full items-center space-x-2"
              >
                <Input
                  placeholder="Type your message..."
                  className="flex-1"
                  autoComplete="off"
                  type="text"
                  name="message"
                />
                <Button type="submit" size="icon" disabled={true}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </Form>
            </CardFooter>
          </Card>
        </>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export const handle = {
  breadcrumb: "appearance",
};
