// chatbots/id/chat/chatId
// this is a chat, basically the ui for the widgets as well

import { Role } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { createMessage, getMessagesByChatId } from "~/models/chat.server";
import { fetchRelevantDocs } from "~/utils/openai";

// on click "new chat" -> create empty chat, and naviagete to chat/id/chatId

// in this page

// loader, loads all the messages for a chat

// action, gets called when user submits a message
// based on action processing data
// if submitted, add the user message to the chat
// this stuff will probably revalidate the loader, so will just show up in loader data

// if processing, show loading spiner on the assistant message
// when finished show the assiatnt message, should also revalidate the loader anyways

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatId = params.chatId as string;

  const messages = await getMessagesByChatId({ chatId });

  // console.log("messages", messages);

  return json({ messages });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const chatId = params.chatId as string;
  const chatbotId = params.chatbotId as string;
  const formData = await request.formData();
  const content = formData.get("message") as string;

  // TESTING
  const relevantDocuments = await fetchRelevantDocs({
    chatbotId,
    input: content,
  });
  console.log("relevantDocuments", relevantDocuments);

  return await createMessage({ chatId, role: Role.USER, content });
};

export default function Chat() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      {data.messages.length === 0 ? (
        <p className="p-4">No messages yet</p>
      ) : (
        <ol className="space-y-4 ">
          {data.messages.map((message) => (
            <li key={message.id}>
              {message.role === Role.USER ? (
                <div className="flex justify-end">
                  <div className="bg-blue-100 p-4 rounded-md">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-md">
                    {message.content}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <Form method="post">
        <input
          type="text"
          name="message"
          className="w-full border-2 border-gray-200 rounded-md p-4"
        />
        <button
          type="submit"
          className="block w-full p-4 text-xl text-blue-500"
        >
          Send
        </button>
      </Form>
    </div>
  );
}
