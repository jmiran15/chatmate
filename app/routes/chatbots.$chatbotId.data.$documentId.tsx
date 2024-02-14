import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Textarea } from "~/components/ui/textarea";
import {
  deleteDocumentById,
  getDocumentById,
  updateDocumentById,
} from "~/models/document.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const id = params.documentId as string;

  switch (action) {
    case "delete": {
      await deleteDocumentById({ id });
      return redirect(`/chatbots/${params.chatbotId}/data`);
    }
    case "save": {
      const name = formData.get("name") as string;
      const content = formData.get("content") as string;
      return await updateDocumentById({ id, name, content });
    }
    default: {
      return json({ error: "Invalid action" }, 400);
    }
  }
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.documentId as string;
  const document = await getDocumentById({ id });
  return json({ document });
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
            defaultValue={data ? data.document!.name : undefined}
          />
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="content">Content</Label>
          <Textarea
            placeholder="Type your message here."
            id="content"
            name="content"
            rows={16}
            defaultValue={data ? (data.document!.content as string) : undefined}
          />
          <p className="text-sm text-muted-foreground">
            This is the data that your chatbot will be able to reference in it's
            responses
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
