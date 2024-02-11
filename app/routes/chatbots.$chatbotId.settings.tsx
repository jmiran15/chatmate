import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { getChatbotById, updateChatbotById } from "~/models/chatbot.server";
import { Chatbot } from "@prisma/client";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // const userId = await requireUserId(request);
  const formData = await request.formData();

  const chatbotId = params.chatbotId as string;
  const name = formData.get("name") as Chatbot["name"];
  const description = formData.get("description") as Chatbot["description"];

  return await updateChatbotById({
    id: chatbotId,
    name,
    description,
  });
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
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
        <div className="flex flex-row justify-between items-center gap-4">
          <Button
            type="submit"
            name="action"
            value="delete"
            variant="destructive"
          >
            Delete
          </Button>
          <Button type="submit" name="action" value="save">
            Save
          </Button>
        </div>
      </Form>
    </ScrollArea>
  );
}

export const handle = {
  breadcrumb: "settings",
};
