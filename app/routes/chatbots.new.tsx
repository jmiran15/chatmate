// // /chatbots/new (after clicking new chatbot), has input boxes for 1. title(required) 2. description (optional), on submit success, redirects to /chatbots/:chatbotId
// maybe we should make a /chatbots layout route
// main use I can think of now is auth protection

import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";

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
  return redirect(`/chatbots/${chatbot.id}`);
};

export default function NewChatbot() {
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Name: </span>
          <input
            ref={nameRef}
            name="name"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            aria-invalid={actionData?.errors?.name ? true : undefined}
            aria-errormessage={
              actionData?.errors?.name ? "title-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.name ? (
          <div className="pt-1 text-red-700" id="title-error">
            {actionData.errors.name}
          </div>
        ) : null}
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Description: </span>
          <textarea
            ref={descriptionRef}
            name="description"
            rows={8}
            className="w-full flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
            aria-invalid={actionData?.errors?.description ? true : undefined}
            aria-errormessage={
              actionData?.errors?.description ? "body-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.description ? (
          <div className="pt-1 text-red-700" id="body-error">
            {actionData.errors.description}
          </div>
        ) : null}
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Save
        </button>
      </div>
    </Form>
  );
}
