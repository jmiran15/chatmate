// // /chatbots/new (after clicking new chatbot), has input boxes for 1. title(required) 2. description (optional), on submit success, redirects to /chatbots/:chatbotId
// maybe we should make a /chatbots layout route
// main use I can think of now is auth protection

import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

import { createChatbot } from "~/models/chatbot.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const name = await formData.get("name");
  const description = await formData.get("description");

  if (typeof name !== "string" || name.length === 0) {
    return json(
      { errors: { description: null, name: "Name is required" } },
      { status: 400 },
    );
  }
  if (typeof description !== "string" || description.length === 0) {
    return json(
      { errors: { description: "Description is required", name: null } },
      { status: 400 },
    );
  }
  const chatbot = await createChatbot({ name, description, userId });
  return redirect(`/chatbots/${chatbot.id}/chat`);
};

export default function NewChatbot() {
  const actionData = useActionData<typeof action>();
  const nameRef = useRef(null);
  const descriptionRef = useRef(null);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData?.errors?.description) {
      descriptionRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      className="flex flex-col gap-8 w-full py-12 px-8 md:px-20 xl:px-96"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name: </Label>

        <Input
          ref={nameRef}
          id="name"
          name="name"
          aria-invalid={actionData?.errors?.name ? true : undefined}
          aria-errormessage={
            actionData?.errors?.name ? "title-error" : undefined
          }
        />
        {actionData?.errors?.name ? (
          <div className="pt-1 text-red-700" id="title-error">
            {actionData.errors.name}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desc">Description: </Label>
        <Textarea
          id="desc"
          ref={descriptionRef}
          name="description"
          rows={8}
          aria-invalid={actionData?.errors?.description ? true : undefined}
          aria-errormessage={
            actionData?.errors?.description ? "body-error" : undefined
          }
        />
        {actionData?.errors?.description ? (
          <div className="pt-1 text-red-700" id="body-error">
            {actionData.errors.description}
          </div>
        ) : null}
      </div>

      <div className="text-right">
        <Button type="submit">Save</Button>
      </div>
    </Form>
  );
}
