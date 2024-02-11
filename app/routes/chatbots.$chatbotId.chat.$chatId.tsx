import { Role } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { createMessage, getMessagesByChatId } from "~/models/chat.server";
import { chat } from "~/utils/openai";
import { Send } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Messages from "~/components/messages";
import { useEffect, useRef } from "react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatId = params.chatId as string;
  const messages = await getMessagesByChatId({ chatId });
  return json({ messages });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const chatId = params.chatId as string;
  const chatbotId = params.chatbotId as string;
  const formData = await request.formData();
  const content = formData.get("message") as string;
  const msgs = JSON.parse(formData.get("messages") as string) || [];

  const messages =
    msgs.length === 0
      ? [
          {
            role: "user",
            content,
          },
        ]
      : [
          ...msgs.map((message) => ({
            role: message.role === Role.USER ? "user" : "assistant",
            content: message.content,
          })),
          {
            role: "user",
            content,
          },
        ];

  const assistantResponse = await chat({
    chatbotId,
    messages,
  });

  await createMessage({ chatId, role: Role.USER, content });
  return await createMessage({
    chatId,
    role: Role.ASSISTANT,
    content: assistantResponse.message.content,
  });
};

export default function Chat() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  console.log("fetcher state is", fetcher.state);
  const formRef = useRef<HTMLFormElement>();
  const inputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    if (isSubmitting) {
      formRef.current?.reset();
    } else {
      inputRef.current?.focus();
    }
  }, [isSubmitting]);

  return (
    <div className="h-full flex flex-col justify-between">
      <Messages
        messages={
          isSubmitting
            ? [
                ...data.messages,
                {
                  role: Role.USER,
                  content: fetcher.formData.get("message") as string,
                  id: "loading-message",
                },
              ]
            : data.messages
        }
        loading={isSubmitting}
      />
      <fetcher.Form method="post" ref={formRef}>
        <input
          type="hidden"
          name="messages"
          value={JSON.stringify(data.messages)}
        />
        <div className="flex flex-row items-center space-x-2 py-4 px-16">
          <Input
            ref={inputRef}
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
            type="text"
            name="message"
          />
          <Button type="submit" size="icon" disabled={isSubmitting}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
