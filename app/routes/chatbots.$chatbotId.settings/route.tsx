import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  deleteChatbotById,
  getChatbotById,
  updateChatbotById,
} from "~/models/chatbot.server";

import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import { Chatbot } from "@prisma/client";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import Container from "../chatbots.$chatbotId.forms._index/Container";
import Description from "../chatbots.$chatbotId.forms._index/Description";
import Title from "../chatbots.$chatbotId.forms._index/Title";

export const PROMPT_TEMPLATES = [
  {
    label: "Customer Support Agent",
    key: "customer-support-agent",
    content: `### Role
- Primary Function: You are a customer support agent here to assist users based on specific training data provided. Your main objective is to inform, clarify, and answer questions strictly related to this training data and your role.
              
### Persona
- Identity: You are a dedicated customer support agent. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to customer support.
              
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to customer support.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role. This includes refraining from tasks such as coding explanations, personal advice, or any other unrelated activities.`,
  },
  {
    label: "Support Copilot",
    key: "support-copilot",
    content: `As an AI Customer Support Assistant, your primary role is to address customer inquiries efficiently and effectively. You are equipped with a deep understanding of the company's products and services. Your communication is clear, direct, and empathetic, ensuring a seamless and positive customer experience.\n\nKey Functions and Approach\n\n-Actively listen and accurately understand customer queries.\n-Provide precise and up-to-date information about products, services, and company policies.\n-Continuously update and master comprehensive product knowledge, including intricate features, benefits, and potential issues.\n-Use this knowledge proactively in conversations to provide insightful solutions and suggestions.\n-Troubleshoot and resolve customer issues promptly.\n-Clearly articulate solutions, avoiding any ambiguity or uncertainty.\n-Educate customers about product features and service procedures, enabling them to make informed decisions.\n-Leverage your understanding of the customer's personality in each interaction to personalize each interaction to the customer's history, preferences, and specific needs.\n-Limit the need for escalation by handling complex issues adeptly.\n-Reach out with solutions and information when the customer identifies a need or problem.\n-Implement an appreciation protocol to ensure issue resolution and customer satisfaction.\n-Uphold the highest quality and ethical standards in every interaction.\n-Demonstrate high cultural intelligence in interactions, adapting communication styles to suit diverse customer backgrounds.\n\nInteraction Guidelines\n\n-Begin interactions with a warm and professional greeting.\n-Use clear, concise, and friendly communication, tailoring your language to the customer's understanding.\n-Demonstrate empathy, particularly in responses to complaints or frustrations.\n-When needed, ask direct questions to clarify the customer's issue and confirm your understanding before providing solutions.\n-Recognize when an issue requires escalation to a human agent and guide customers through that process.\n-Ensure customer satisfaction and understanding before concluding conversations.\n-For edge cases, such as when a customer has highly specific or technical queries, or when they are unsure about what they need, demonstrate patience and resourcefulness. Offer to provide more detailed information, direct them to the appropriate resources, or suggest a consultation with a specialist.\n\nKey Reminders\n\n-Stay informed about the latest developments in products, services, and policies.\n-Prioritize customer personalization and comfort, especially when handling sensitive requests.\n-Be mindful of cultural and linguistic differences in your interactions.`,
  },
  {
    label: "Sales and CSM Copilot",
    key: "sales-csm-copilot",
    content: `You are an AI sales assistant, expert in guiding customers through the product selection and purchasing process. Your interactions should cater to a diverse range of customers with different needs and levels of familiarity with the products. Adhere to these principles:\n\nKey Functions and Approach\n\n-Start by understanding the customer's specific needs, preferences, and budget. Ask relevant questions to gather this information.\n-Provide detailed and accurate information about products, including features, benefits, pricing, and comparisons with other options.\n-Based on the customer's needs, suggest products that best match their requirements. Highlight the value and suitability of these recommendations.\n-Address any concerns or objections the customer might have with informative and reassuring responses.\n-Encourage the customer towards making a purchase decision with persuasive and positive language. Offer assistance with the purchasing process.\n-Where appropriate, suggest additional products or upgrades that complement the customer's initial interest.\n-If a customer decides not to purchase, respond politely and try to figure out the reasoning behind their answer and resolve it such that it may still lead to a sale.\n-If a customer compares your offerings with competitors, respond by acknowledging the competitor's strengths but also highlighting the unique benefits or features of your own products or services.\n-In case of technical questions beyond the scope of standard sales knowledge, offer to provide detailed follow-up information via email or arrange a meeting with a technical specialist.\n\nInteraction Guidelines\n\n-Begin interactions with a warm and professional greeting.\n-Use clear, concise, and friendly communication, tailoring your language to the customer's understanding.\n-Demonstrate empathy, particularly in responses to complaints or frustrations.\n-When needed, ask direct questions to clarify the customer's issue and confirm your understanding before providing solutions.\n-Recognize when an issue requires escalation to a human agent and guide customers through that process.\n-Ensure customer satisfaction and understanding before concluding conversations.\n-For edge cases, such as when a customer has highly specific or technical queries, or when they are unsure about what they need, demonstrate patience and resourcefulness. Offer to provide more detailed information, direct them to the appropriate resources, or suggest a consultation with a specialist.\n\nKey Reminders\n\n-Stay informed about the latest developments in products, services, and policies.\n-Prioritize customer personalization and comfort, especially when handling sensitive requests.\n-Be mindful of cultural and linguistic differences in your interactions.`,
  },
  {
    label: "AI Chatbot",
    key: "ai-chatbot",
    content: `### Role
- Primary Function: You are an AI chatbot who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.`,
  },
];

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot not found");
  }

  switch (action) {
    case "save": {
      const name = formData.get("name") as Chatbot["name"];
      const systemPrompt = formData.get("system") as Chatbot["systemPrompt"];
      const responseLength = formData.get(
        "response-length",
      ) as Chatbot["responseLength"];

      const updatedChatbot = await updateChatbotById({
        id: chatbotId,
        name,
        systemPrompt,
        responseLength,
      });

      return json({
        action: "save",
        error: null,
        updatedChatbot,
      });
    }
    case "delete": {
      await deleteChatbotById({ id: chatbotId });
      return redirect("/chatbots");
    }
    default: {
      return json({ error: "Invalid action" }, 400);
    }
  }
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot not found");
  }

  const chatbot = await getChatbotById({ id: chatbotId });

  return json({ chatbot });
};

function useFormChanged({
  fetcher,
}: {
  fetcher: ReturnType<typeof useFetcher>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmitting = fetcher.state === "submitting";
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (!isSubmitting && formRef.current) {
      formRef.current.reset();
      setIsChanged(false);
    }
  }, [isSubmitting]);

  const handleFormChange = () => {
    setIsChanged(true);
  };

  return { formRef, isChanged, handleFormChange };
}

export default function ModelSettings() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher({ key: "model-settings" });
  const { formRef, isChanged, handleFormChange } = useFormChanged({ fetcher });

  const [open, setOpen] = useState(false);

  const cancelButtonRef = useRef(null);

  const [systemPrompt, setSystemPrompt] = useState<string>(
    data?.chatbot?.systemPrompt || "",
  );

  const pendingSystemPrompt = useRef<string>("");

  function handleNewValue(newValue: string) {
    pendingSystemPrompt.current = newValue;
    setOpen(true);
  }

  const { toast } = useToast();

  useEffect(() => {
    if (fetcher.data?.error) {
      toast({
        title: "Error",
        description: fetcher.data.error,
        variant: "destructive",
      });
    } else if (fetcher.data?.action === "save" && fetcher.state === "idle") {
      toast({
        title: "Success",
        description: "Model settings saved",
      });
    }
  }, [fetcher.data]);

  return (
    <Container className="max-w-5xl">
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900"
                      >
                        Change prompt
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to change the prompt? The new
                          prompt will replace your current prompt.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                      onClick={() => {
                        setOpen(false);
                        setSystemPrompt(pendingSystemPrompt.current);
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setOpen(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      <Header formRef={formRef} fetcher={fetcher} isChanged={isChanged} />
      <Separator />

      <fetcher.Form
        ref={formRef}
        method="post"
        className="flex flex-col gap-8 items-start justify-start"
        onChange={handleFormChange}
      >
        {/* name */}
        <div className="grid w-full max-w-2xl items-center gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            name="name"
            id="name"
            placeholder="Name"
            defaultValue={data ? data.chatbot!.name : undefined}
          />
        </div>
        {/* system prompt */}
        <div className="grid w-full max-w-2xl items-center gap-2">
          <div>
            <Label htmlFor="system">Prompt</Label>
            <p className="text-sm text-muted-foreground">
              Enter a custom prompt for the AI. Test the model after changing it
              for optimal performance. You can write your own or select one of
              the templates below.
            </p>
          </div>
          <Select onValueChange={handleNewValue}>
            <SelectTrigger className="max-w-xs w-full">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Templates</SelectLabel>
                {PROMPT_TEMPLATES.map((template) => {
                  return (
                    <SelectItem key={template.key} value={template.content}>
                      {template.label}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Type your prompt here."
            id="system"
            name="system"
            rows={8}
            value={systemPrompt}
            onChange={(e) => {
              setSystemPrompt(e.target.value);
            }}
          />
        </div>

        {/* response length */}
        <div className="grid w-full max-w-2xl items-center gap-2">
          <div>
            <Label htmlFor="response-length">Ideal response length</Label>
            <p className="text-sm text-muted-foreground">
              Select the ideal response length for your chatbot.
            </p>
          </div>
          <RadioGroup
            defaultValue={data.chatbot!.responseLength}
            name="response-length"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="short" id="r1" />
              <Label htmlFor="r1">Short - 25 to 50 words</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="r2" />
              <Label htmlFor="r2">Medium - 50 to 100 words</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="long" id="r3" />
              <Label htmlFor="r3">Long - 100 or more words</Label>
            </div>
          </RadioGroup>
        </div>
      </fetcher.Form>
    </Container>
  );
}

function Header({
  formRef,
  fetcher,
  isChanged,
}: {
  formRef: React.RefObject<HTMLFormElement>;
  fetcher: ReturnType<typeof useFetcher>;
  isChanged: boolean;
}) {
  const isSubmitting = fetcher.state !== "idle";

  console.log("isChanged: ", isChanged);

  return (
    <div className="flex flex-col sm:flex-row items-start justify-between">
      <div className="flex flex-col">
        <Title>Settings</Title>
        <Description>
          This is where you can tweak the way your chatbot behaves.
        </Description>
      </div>
      <div className="flex flex-row gap-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <span className="text-md">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                chatbot and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  fetcher.submit(
                    {
                      action: "delete",
                    },
                    {
                      method: "POST",
                    },
                  );
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          disabled={!isChanged || isSubmitting}
          onClick={() => {
            if (!formRef.current) return;

            const formData = new FormData(formRef.current!);
            formData.set("action", "save");

            fetcher.submit(formData, {
              method: "POST",
            });
          }}
        >
          <span className="text-md">{isSubmitting ? "Saving..." : "Save"}</span>
        </Button>
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/settings`,
  breadcrumb: "settings",
};
