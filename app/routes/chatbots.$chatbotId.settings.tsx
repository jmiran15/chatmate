import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { getChatbotById, updateChatbotById } from "~/models/chatbot.server";
import { Chatbot, Model } from "@prisma/client";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // const userId = await requireUserId(request);
  const formData = await request.formData();

  const chatbotId = params.chatbotId as string;
  const name = formData.get("name") as Chatbot["name"];
  const description = formData.get("description") as Chatbot["description"];
  const model = formData.get("model") as Chatbot["model"];
  const temperature = Number(
    formData.get("temperature") as Chatbot["temperature"],
  );
  const maxTokens = Number(formData.get("maxTokens") as Chatbot["maxTokens"]);
  const systemPrompt = formData.get("systemPrompt") as Chatbot["systemPrompt"];

  return await updateChatbotById({
    id: chatbotId,
    name,
    description,
    model,
    temperature,
    maxTokens,
    systemPrompt,
  });
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  // load the chatbot

  const chatbotId = params.chatbotId;
  const chatbot = await getChatbotById({ id: chatbotId });

  return json({ chatbot });
};

export default function ModelC() {
  const data = useLoaderData<typeof loader>();

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        padding: "2rem",
      }}
    >
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Name: </span>
          <input
            defaultValue={data ? data.chatbot!.name : undefined}
            name="name"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
          />
        </label>
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Description: </span>
          <textarea
            defaultValue={
              data ? (data.chatbot!.description as string) : undefined
            }
            name="description"
            rows={8}
            className="w-full flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
          />
        </label>
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-900 dark:text-white">
          <span>Select a model: </span>
          <select
            name="model"
            defaultValue={data ? (data.chatbot!.model as string) : undefined}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value={Model.GPT35}>GPT35</option>
            <option value={Model.GPT4}>GPT4</option>
            <option value={Model.GEMINI}>GEMINI</option>
            <option value={Model.LLAMA2}>LLAMA2</option>
          </select>
        </label>
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-900 dark:text-white">
          <span>Temperature: </span>
          <input
            defaultValue={
              data ? (data.chatbot!.temperature as number) : undefined
            }
            name="temperature"
            type="range"
            min={0}
            max={2}
            step={0.1}
            className="w-full"
          />
        </label>
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-900 dark:text-white">
          <span>Max Tokens: </span>
          <input
            name="maxTokens"
            defaultValue={
              data ? (data.chatbot!.maxTokens as number) : undefined
            }
            type="range"
            min="0"
            max="1000"
            step="1"
            className="w-full"
          />
        </label>
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>System Prompt: </span>
          <textarea
            name="systemPrompt"
            defaultValue={
              data ? (data.chatbot!.systemPrompt as string) : undefined
            }
            rows={8}
            className="w-full flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
          />
        </label>
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </Form>
  );
}

export const handle = {
  breadcrumb: "settings",
};
