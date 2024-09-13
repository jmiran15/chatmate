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

import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { prisma } from "~/db.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { chatbotId } = params;
  const formData = await request.formData();
  const name = String(formData.get("name"));

  if (typeof name !== "string" || name.length === 0) {
    return json({ errors: { name: "Name is required" } }, { status: 400 });
  }

  // create a basic form Schema
  const schema = z.object({
    name: z.string().describe("Name"),
    email: z
      .string({
        required_error: "Email is required",
      })
      .describe("Email")
      .email(),
  });

  const formElements = [
    { name: "name", order: 0 },
    { name: "email", order: 1 },
  ];

  const orderedElements = [...formElements].sort((a, b) => a.order - b.order);
  const orderedSchemaObj: Record<string, z.ZodTypeAny> = {};
  const orderedFieldConfigObj: Record<string, any> = {};

  orderedElements.forEach((element, index) => {
    orderedSchemaObj[element.name] =
      schema.shape[element.name as keyof typeof schema.shape];
    orderedFieldConfigObj[element.name] = {
      order: index,
      // Add any additional field config properties here
    };
  });

  const orderedSchema = z.object(orderedSchemaObj);

  const jsonSchema = zodToJsonSchema(orderedSchema, "formSchema");

  const formSchema = {
    schema: jsonSchema,
    fieldConfig: orderedFieldConfigObj,
  };

  // create the form
  const form = await prisma.form.create({
    data: {
      name,
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
      formSchema: formSchema as any,
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
      className="flex flex-col gap-8 w-full py-12 px-8 md:px-20 xl:px-96"
    >
      <div className="flex flex-col gap-1.5">
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

      {/* TODO: Add template selection here later */}
      {/* <div>
        <Label>Template Selection (to be implemented)</Label>
      </div> */}

      <div className="text-right">
        <Button type="submit">Create Form</Button>
      </div>
    </Form>
  );
}

export const handle = {
  PATH: (chatbotId: string, formId: string) => `/chatbots/${chatbotId}/forms`,
  breadcrumb: "forms",
  getSitemapEntries: () => null,
};
