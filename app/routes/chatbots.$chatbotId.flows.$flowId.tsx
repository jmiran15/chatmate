import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { prisma } from "~/db.server";

const triggerSchema = z.object({
  type: z.enum(["onInitialLoad", "customTrigger"]),
  description: z
    .string()
    .optional()
    .refine((val) => {
      if (val === "customTrigger") {
        return val && val.length > 0;
      }
      return true;
    }, "Description is required for custom trigger"),
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

type FlowSchema = z.infer<typeof flowSchema>;

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
  const flowData = JSON.parse(formData.get("flowData") as string);

  try {
    const validatedData = flowSchema.parse(flowData);

    await prisma.flow.update({
      where: { id: flowId },
      data: {
        name: validatedData.name,
        flowSchema: validatedData,
      },
    });

    return json({ success: true });
  } catch (error) {
    return json({ error: "Invalid flow data" }, { status: 400 });
  }
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

  const onSubmit = (data: FlowSchema) => {
    submit({ flowData: JSON.stringify(data) }, { method: "post" });
  };

  return (
    <div className="container mx-auto p-4 h-full flex flex-col overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <header className="flex justify-between items-center mb-6">
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold">{form.watch("name")}</h1>
            <Button type="submit">Save</Button>
          </header>

          <div className="space-y-6">
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleCard("trigger")}
              >
                <CardTitle className="flex justify-between items-center">
                  Trigger
                  {openCards["trigger"] ? <ChevronUp /> : <ChevronDown />}
                </CardTitle>
              </CardHeader>
              {openCards["trigger"] && (
                <CardContent>
                  <FormField
                    control={form.control}
                    name="trigger.type"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="onInitialLoad">
                              On initial load
                            </SelectItem>
                            <SelectItem value="customTrigger">
                              Custom trigger
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {form.watch("trigger.type") === "customTrigger" && (
                    <FormField
                      control={form.control}
                      name="trigger.description"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <Textarea
                            {...field}
                            placeholder="Enter a detailed description of when the chatbot should trigger this flow."
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              )}
              {openCards["trigger"] && (
                <CardFooter>
                  <Button variant="ghost" onClick={() => toggleCard("trigger")}>
                    Close
                  </Button>
                </CardFooter>
              )}
            </Card>

            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleCard(field.id)}
                >
                  <CardTitle className="flex justify-between items-center">
                    <span>Action {index + 1}</span>
                    {openCards[field.id] ? <ChevronUp /> : <ChevronDown />}
                  </CardTitle>
                </CardHeader>
                {openCards[field.id] && (
                  <CardContent>
                    <FormField
                      control={form.control}
                      name={`actions.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select action type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="form">Form</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    {form.watch(`actions.${index}.type`) === "form" && (
                      <FormField
                        control={form.control}
                        name={`actions.${index}.formId`}
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a form" />
                              </SelectTrigger>
                              <SelectContent>
                                {forms.map((form) => (
                                  <SelectItem key={form.id} value={form.id}>
                                    {form.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {form.watch(`actions.${index}.type`) === "text" && (
                      <FormField
                        control={form.control}
                        name={`actions.${index}.text`}
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <Textarea {...field} placeholder="Enter text" />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name={`actions.${index}.delay`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Delay (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                )}
                {openCards[field.id] && (
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => toggleCard(field.id)}
                    >
                      Close
                    </Button>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                )}
              </Card>
            ))}

            <div className="flex justify-center mt-6">
              <Button
                type="button"
                onClick={() => {
                  const newField = { type: "form" };
                  append(newField);
                  setOpenCards((prev) => ({ ...prev, [newField.id]: true }));
                }}
                className="rounded-full w-12 h-12 p-0"
                variant="ghost"
              >
                <Plus className="h-6 w-6" />
                <span className="sr-only">Add Action</span>
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
