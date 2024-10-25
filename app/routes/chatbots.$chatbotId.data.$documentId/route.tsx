import { DocumentType, MatchType, ResponseType } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSubmit,
} from "@remix-run/react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useEventSource } from "remix-utils/sse/react";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { prisma } from "~/db.server";
import { cn } from "~/lib/utils";
import { getDocumentById } from "~/models/document.server";
import { queue } from "~/queues/ingestion/ingestion.server";
import { qaqueue } from "~/queues/qaingestion/qaingestion.server";
import { requireUserId } from "~/session.server";
import { ProgressData } from "../api.chatbot.$chatbotId.data.progress";
import Container from "../chatbots.$chatbotId.forms._index/Container";

// TODO: we probably do not need to reingest unless the question or content has changed (i.e. if the match or response type changes, we just update in the db not ingestion)

// TODO: Q&A type documents need to be handled differently
// we need to add the form fields for the match type, match phrase, response type
// and we need to handle on save properly

// ALSO ... we need to make sure bullmq cancels any pending ingestion jobs with the same documentId (i.e. if I stack a new ingestion job, it should cancel the previous one)

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { chatbotId, documentId } = params;
  const userId = await requireUserId(request);

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  if (!documentId) {
    throw new Error("Document id is required");
  }

  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
  });

  if (chatbot?.userId !== userId) {
    throw new Error("User does not have access to chatbot");
  }

  const document = await getDocumentById({ id: documentId });

  return json({ document });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const { documentId } = params;
  const intent = String(formData.get("intent"));

  if (!documentId) {
    throw new Error("Document id is required");
  }

  // fetch the document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  switch (intent) {
    case "save": {
      const type = String(formData.get("type")) as DocumentType;
      const isQA = type === DocumentType.QA;

      let name, content, question, matchType, responseType;

      if (isQA) {
        question = String(formData.get("question"));
        matchType = String(formData.get("matchType")) as MatchType;
        responseType = String(formData.get("responseType")) as ResponseType;
        content = String(formData.get("content"));

        if (question.length === 0) {
          return json(
            { errors: { question: "Question is required", content: null } },
            { status: 400 },
          );
        }

        name = question; // For QA documents, the name is the question
      } else {
        name = formData.get("name") as string;
        content = formData.get("content") as string;

        if (name.length === 0) {
          return json(
            { errors: { name: "Name is required", content: null } },
            { status: 400 },
          );
        }
      }

      if (content.length === 0) {
        return json(
          { errors: { name: null, content: "Content is required" } },
          { status: 400 },
        );
      }

      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          name,
          content,
          ...(isQA
            ? {
                question,
                matchType: matchType as MatchType,
                responseType: responseType as ResponseType,
              }
            : {}),
        },
      });

      const queueToUse = isQA ? qaqueue : queue;
      const jobPrefix = isQA ? "qaingestion" : "ingestion";

      // lets check if the updatedDocument content or question has changed
      if (
        updatedDocument.content !== document.content ||
        updatedDocument.question !== document.question
      ) {
        await queueToUse.add(
          `${jobPrefix}-${updatedDocument.id}`,
          { document: updatedDocument },
          // { jobId: document.id }, If we set the jobId, the job gets ignored since we already have a job with the same id (from initial ingestion)
        );
        // update document isPending to true
        await prisma.document.update({
          where: { id: documentId },
          data: { isPending: true },
        });
      }

      return json({
        intent: "save",
        document,
        errors: null,
      });
    }
    default: {
      throw new Error("Invalid action");
    }
  }
};

// Add this Spinner component at the top level of your file
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function DocumentPage() {
  const { toast } = useToast();
  const submit = useSubmit();
  const fetcher = useFetcher<typeof action>();
  const { chatbotId, documentId } = useParams();
  const { document } = useLoaderData<typeof loader>();
  const eventSource = useEventSource(`/api/chatbot/${chatbotId}/data/progress`);
  const progress: ProgressData | undefined = useMemo(() => {
    return eventSource ? JSON.parse(eventSource) : undefined;
  }, [eventSource]);

  const [isIngesting, setIsIngesting] = useState<boolean>(() => {
    return document?.isPending ?? false;
  });

  const isSaving =
    fetcher.formData && fetcher.formData?.get("intent") === "save";

  const isDeleting =
    fetcher.formData && fetcher.formData?.get("intent") === "delete";
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (fetcher?.data?.errors?.name) {
      nameRef.current?.focus();
    } else if (fetcher?.data?.errors?.content) {
      contentRef.current?.focus();
    }

    if (
      fetcher.state === "idle" &&
      fetcher.data?.intent === "save" &&
      fetcher.data?.document &&
      !fetcher.data.errors
    ) {
      toast({
        title: "Success",
        description: "Document was successfully saved",
      });
    }
  }, [fetcher]);

  if (!document) {
    throw new Error("Document not found");
  }

  const optimisticDocumentName =
    fetcher.formData && String(fetcher.formData.get("intent")) === "save"
      ? document.type === "QA"
        ? String(fetcher.formData.get("question"))
        : String(fetcher.formData.get("name"))
      : document?.name;

  useEffect(() => {
    if (document.isPending || isSaving) {
      setIsIngesting(true);
    } else {
      setIsIngesting(false);
    }
  }, [document.isPending, isSaving]);

  useEffect(() => {
    if (
      progress &&
      progress.documentId === documentId &&
      ["ingestion", "qaingestion"].includes(progress.queueName) &&
      progress.completed
    ) {
      setIsIngesting(false);
    }
  }, [progress, documentId]);

  if (!documentId) return null;
  return (
    <Container className="max-w-5xl">
      <div className="flex items-center justify-between w-full flex-wrap gap-4">
        <div className="flex items-center justify-start gap-4 max-w-full shrink">
          <Link
            to={`/chatbots/${chatbotId}/data`}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-7 w-7",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="flex-1 text-xl font-semibold tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
            {optimisticDocumentName}
          </h1>
          <Badge
            className={cn(
              "ml-auto sm:ml-0 whitespace-nowrap text-xs font-medium px-2.5 py-0.5 rounded flex items-center gap-2",
              isIngesting
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800",
            )}
          >
            {isIngesting && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Spinner />
              </motion.div>
            )}
            <span>{isIngesting ? "Ingesting" : "Ingested"}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              submit(
                { intent: "delete", documentId },
                {
                  action: `/chatbots/${chatbotId}/data?index`,
                  method: "post",
                  navigate: true,
                },
              )
            }
            disabled={isIngesting}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={() => fetcher.submit(formRef.current, { method: "post" })}
            disabled={isIngesting}
          >
            Save Document
          </Button>
        </div>
      </div>
      <Form
        method="post"
        action={`/chatbots/${chatbotId}/data/${documentId}`}
        ref={formRef}
      >
        <fieldset
          disabled={isSaving || isDeleting || isIngesting}
          className="flex flex-col gap-6"
        >
          <input type="hidden" name="intent" value="save" />
          <input type="hidden" name="type" value={document.type} />

          {document?.type === "QA" ? (
            <Fragment>
              <div className="grid gap-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  ref={nameRef}
                  autoFocus={true}
                  type="text"
                  name="question"
                  id="question"
                  placeholder="Question"
                  defaultValue={document.name}
                />
                {fetcher?.data?.errors?.question ? (
                  <p className="pt-1 text-red-500 text-sm font-medium leading-none">
                    {fetcher.data.errors.question}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Match Type</Label>
                <RadioGroup
                  defaultValue={document.matchType ?? "EXACT"}
                  name="matchType"
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EXACT" id="exact" />
                    <Label htmlFor="exact">Exact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BROAD" id="broad" />
                    <Label htmlFor="broad">Broad</Label>
                  </div>
                </RadioGroup>
              </div>
            </Fragment>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                ref={nameRef}
                autoFocus={true}
                type="text"
                name="name"
                id="name"
                placeholder="Name"
                defaultValue={document?.name}
              />
              {fetcher?.data?.errors?.name ? (
                <p className="pt-1 text-red-500 text-sm font-medium leading-none">
                  {fetcher.data.errors.name}
                </p>
              ) : null}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            {document.content ? (
              <>
                <Textarea
                  ref={contentRef}
                  placeholder="Type your message here."
                  id="content"
                  name="content"
                  rows={16}
                  defaultValue={document.content}
                />
                {fetcher?.data?.errors?.content ? (
                  <p className="pt-1 text-red-500 text-sm font-medium leading-none">
                    {fetcher.data.errors.content}
                  </p>
                ) : null}
              </>
            ) : (
              <Skeleton count={10} />
            )}
          </div>

          {document?.type === "QA" && (
            <div className="grid gap-2">
              <Label>Response Type</Label>
              <RadioGroup
                defaultValue={document.responseType ?? "GENERATIVE"}
                name="responseType"
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="STATIC" id="static" />
                  <Label htmlFor="static">Static</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GENERATIVE" id="generative" />
                  <Label htmlFor="generative">Generative</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </fieldset>
      </Form>
    </Container>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  breadcrumb: "data",
};
