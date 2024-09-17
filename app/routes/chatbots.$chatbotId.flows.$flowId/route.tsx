import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { prisma } from "~/db.server";
import Action from "./action";
import Header from "./header";
import Trigger from "./trigger";

const triggerSchema = z.object({
  type: z.enum(["INITIAL_LOAD", "CUSTOM_EVENT"]),
  description: z.string().optional(),
});
const actionSchema = z
  .object({
    type: z.enum(["form", "text"]),
    formId: z.string().optional(),
    text: z.string().optional(),
    delay: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "form") {
        return !!data.formId;
      } else {
        return !!data.text;
      }
    },
    {
      message: "Form or text is required based on the selected type",
      path: ["formId"],
    },
  );

const flowSchema = z.object({
  name: z.string(),
  trigger: triggerSchema,
  actions: z.array(actionSchema).min(1, "At least one action is required"),
});

export type FlowSchema = z.infer<typeof flowSchema>;

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatbotId, flowId } = params;

  if (!chatbotId || !flowId) {
    throw new Error("Chatbot ID and Flow ID are required");
  }

  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: { chatbot: true },
  });

  if (!flow) {
    throw new Response("Flow not found", { status: 404 });
  }

  if (flow.chatbotId !== chatbotId) {
    throw new Response("Flow does not belong to this chatbot", { status: 403 });
  }

  const forms = await prisma.form.findMany({
    where: { chatbotId },
    select: { id: true, name: true },
  });

  return json({ flow, forms });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { chatbotId, flowId } = params;

  if (!chatbotId || !flowId) {
    throw new Error("Chatbot ID and Flow ID are required");
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "save") {
    const flowData = JSON.parse(formData.get("flowData") as string);

    try {
      const validatedData = flowSchema.parse(flowData);

      await prisma.flow.update({
        where: { id: flowId },
        data: {
          name: validatedData.name,
          trigger: validatedData.trigger.type,
          flowSchema: validatedData,
        },
      });

      return json({ success: true });
    } catch (error) {
      return json({ error: "Invalid flow data" }, { status: 400 });
    }
  } else if (action === "delete") {
    try {
      await prisma.flow.delete({ where: { id: flowId } });
      return redirect(`/chatbots/${chatbotId}/flows`);
    } catch (error) {
      console.error("Error deleting flow:", error);
      return json({ error: "Failed to delete flow" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function FlowMaker() {
  const { flow, forms } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const form = useForm<FlowSchema>({
    resolver: zodResolver(flowSchema),
    defaultValues: flow.flowSchema as FlowSchema,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "actions",
  });

  const [openCards, setOpenCards] = useState<{ [key: string]: boolean }>({
    trigger: true,
    ...fields.reduce((acc, field) => ({ ...acc, [field.id]: true }), {}),
  });

  const toggleCard = (id: string) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    submit({ _action: "delete" }, { method: "post" });
    setIsDeleteDialogOpen(false);
  }, [submit]);

  const onSubmit = (data: FlowSchema) => {
    submit(
      { flowData: JSON.stringify(data), _action: "save" },
      { method: "post" },
    );
  };

  return (
    <div className="mx-auto p-4 h-full  flex flex-col overflow-hidden">
      <Form {...form}>
        <Header
          flowName={form.watch("name")}
          onSave={form.handleSubmit(onSubmit)}
          onDelete={handleDelete}
          isDeleteDialogOpen={isDeleteDialogOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          confirmDelete={confirmDelete}
        />
        <div className="gap-6 mt-4 w-full h-full flex flex-col items-center overflow-y-auto">
          <Trigger toggleCard={toggleCard} openCards={openCards} form={form} />
          {fields.map((field, index) => (
            <Action
              key={field.id}
              toggleCard={toggleCard}
              openCards={openCards}
              form={form}
              index={index}
              field={field}
              remove={() => remove(index)}
              forms={forms}
            />
          ))}
          <Button
            type="button"
            onClick={() => {
              const newField: z.infer<typeof actionSchema> = {
                type: "form" as const,
              };
              append(newField);
              const newId = fields[fields.length].id;
              setOpenCards((prev) => ({ ...prev, [newId]: true }));
            }}
            className="rounded-full p-2"
            variant="ghost"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </Form>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/flows`,
  breadcrumb: "flows",
};
