import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { getChatbotById, updateChatbotById } from "~/models/chatbot.server";
import { Chatbot, Model } from "@prisma/client";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";

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
    <ScrollArea className="h-full w-full">
      <Form method="post" className="flex flex-col gap-6 p-8">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            name="name"
            id="name"
            placeholder="Name"
            defaultValue={data ? data.chatbot!.name : undefined}
          />
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            placeholder="Type your message here."
            id="description"
            name="description"
            rows={8}
            defaultValue={
              data ? (data.chatbot!.description as string) : undefined
            }
          />
          <p className="text-sm text-muted-foreground">
            Describe your chatbot to help you remember what it does.
          </p>
        </div>

        <Select
          defaultValue={data ? (data.chatbot!.model as string) : undefined}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Models</SelectLabel>
              <SelectItem value={Model.GPT35}>GPT-3.5</SelectItem>
              <SelectItem value={Model.GPT4}>GPT-4</SelectItem>
              <SelectItem value={Model.GEMINI}>Gemini</SelectItem>
              <SelectItem value={Model.LLAMA2}>Llama 2</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div>
          <label
            htmlFor="temp"
            className="block mb-2 font-medium text-gray-900 dark:text-white"
          >
            <span>Temperature: </span>

            <Slider
              id="temp"
              defaultValue={data ? [data.chatbot!.temperature as number] : []}
              name="temperature"
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
          </label>
        </div>

        <div>
          <label
            htmlFor="maxTokens"
            className="block mb-2 font-medium text-gray-900 dark:text-white"
          >
            <span>Max Tokens: </span>

            <Slider
              id="maxTokens"
              defaultValue={data ? [data.chatbot!.maxTokens as number] : []}
              name="temperature"
              min={0}
              max={1000}
              step={1}
              className="w-full"
            />
          </label>
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="system">System prompt</Label>
          <Textarea
            placeholder="Type your message here."
            id="system"
            name="systemPrompt"
            rows={8}
            defaultValue={
              data ? (data.chatbot!.systemPrompt as string) : undefined
            }
          />
          <p className="text-sm text-muted-foreground">
            The system prompt is the initial message that the chatbot will use
            to start the conversation.
          </p>
        </div>

        <Button type="submit">Save</Button>
      </Form>
    </ScrollArea>
  );
}

export const handle = {
  breadcrumb: "settings",
};
