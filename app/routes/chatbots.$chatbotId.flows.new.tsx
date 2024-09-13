import {
  ActionFunctionArgs,
  MetaFunction,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { prisma } from "~/db.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { chatbotId } = params;
  const formData = await request.formData();
  const name = String(formData.get("name"));

  if (typeof name !== "string" || name.length === 0) {
    return json({ errors: { name: "Name is required" } }, { status: 400 });
  }

  const flowSchema = {
    name,
    trigger: {
      type: "customTrigger",
      description: "Whenever the user asks about our pricing",
    },
    actions: [
      {
        type: "text",
        text: "Heyyy...  our pricing is $100, $200, $300",
        delay: 2,
      },
    ],
  };

  const flow = await prisma.flow.create({
    data: {
      name,
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
      flowSchema: flowSchema as any,
    },
  });

  if (!flow) {
    return json({ errors: { name: "Failed to create flow" } }, { status: 500 });
  }

  return redirect(`/chatbots/${chatbotId}/flows/${flow.id}`);
};

export const meta: MetaFunction = () => [{ title: "New Flow" }];

export default function NewFlow() {
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      className="flex flex-col gap-8 w-full py-12 px-8 md:px-20 xl:px-96"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Flow Name: </Label>

        <Input
          ref={nameRef}
          id="name"
          name="name"
          aria-invalid={actionData?.errors?.name ? true : undefined}
          aria-errormessage={
            actionData?.errors?.name ? "name-error" : undefined
          }
        />
        {actionData?.errors?.name ? (
          <div className="pt-1 text-red-700" id="name-error">
            {actionData.errors.name}
          </div>
        ) : null}
      </div>

      <div className="text-right">
        <Button type="submit">Create Flow</Button>
      </div>
    </Form>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/flows`,
  breadcrumb: "flows",
  getSitemapEntries: () => null,
};
