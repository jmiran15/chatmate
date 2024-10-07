import { createId } from "@paralleldrive/cuid2";
import { FormElement, InputType } from "@prisma/client";
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

  const nameElement: Partial<FormElement> = {
    id: createId(),
    type: InputType.TEXT,
    name: "name",
    label: `What is your name?`,
    required: true,
    placeholder: `Enter your name`,
    order: 0,
  };

  const emailElement: Partial<FormElement> = {
    id: createId(),
    type: InputType.EMAIL,
    name: "email",
    label: `What is your email?`,
    required: false,
    placeholder: `Enter your email`,
    order: 1,
  };

  const formElements = [nameElement, emailElement];

  // create the form with formElements
  const form = await prisma.form.create({
    data: {
      name,
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
      elements: {
        create: formElements,
      },
    },
  });

  if (!form) {
    return json({ errors: { name: "Failed to create form" } }, { status: 500 });
  }

  return redirect(`/chatbots/${chatbotId}/forms/${form.id}`);
};

export const meta: MetaFunction = () => [{ title: "New Form" }];

export default function NewForm() {
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
      className="flex flex-col items-center justify-start gap-8 w-full py-12 px-8"
    >
      <div className="flex flex-col gap-1.5 w-full max-w-lg">
        <Label htmlFor="name">Form Name: </Label>
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

      <div className="text-right w-full max-w-lg flex justify-end">
        <Button type="submit">Create Form</Button>
      </div>
    </Form>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/forms`,
  breadcrumb: "forms",
  getSitemapEntries: () => null,
};
