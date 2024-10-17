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
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { prisma } from "~/db.server";
import { cn } from "~/lib/utils";
import { getDocumentById, updateDocumentById } from "~/models/document.server";
import { queue } from "~/queues/ingestion/ingestion.server";
import { requireUserId } from "~/session.server";
import Container from "../chatbots.$chatbotId.forms._index/Container";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { chatbotId, documentId } = params;
  await requireUserId(request);

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  if (!documentId) {
    throw new Error("Document id is required");
  }

  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
  });

  // if (chatbot?.userId !== userId) {
  //   throw new Error("User does not have access to chatbot");
  // }

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

  switch (intent) {
    case "save": {
      // validate - make sure they are not empty

      const name = formData.get("name") as string;
      const content = formData.get("content") as string;

      if (name.length === 0) {
        return json(
          { errors: { name: "Name is required", content: null } },
          { status: 400 },
        );
      }

      if (content.length === 0) {
        return json(
          { errors: { name: null, content: "Content is required" } },
          { status: 400 },
        );
      }

      const document = await updateDocumentById({
        id: documentId,
        name,
        content,
      });

      await queue.add(
        `ingestion-${document.id}`,
        { document },
        { jobId: document.id },
      );

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

export default function DocumentPage() {
  const { toast } = useToast();
  const submit = useSubmit();
  const fetcher = useFetcher<typeof action>();
  const { chatbotId, documentId } = useParams();
  const { document } = useLoaderData<typeof loader>();
  // const pendingDocuments = usePendingDocuments();
  // const optimisticDocument = pendingDocuments.find(
  //   (document) => document.id === documentId,
  // );
  // const eventSource = useEventSource(`/api/chatbot/${chatbotId}/data/progress`);
  // const progress: ProgressData | undefined = useMemo(() => {
  //   return eventSource ? JSON.parse(eventSource) : undefined;
  // }, [eventSource]);

  // const { content, status } = useDocumentProgress({
  //   item: document || optimisticDocument,
  //   progress,
  // });

  const isSaving =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("intent") === "save";
  const isDeleting =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("intent") === "delete";
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
      ? String(fetcher.formData.get("name"))
      : document?.name;

  if (!documentId) return;
  return (
    // <div className="flex flex-col p-4 gap-8 w-full h-full overflow-y-auto">
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
          <Badge variant="secondary" className="ml-auto sm:ml-0">
            {document.isPending ? "Ingesting" : "Ingested"}
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
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={() => fetcher.submit(formRef.current, { method: "post" })}
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
          disabled={isSaving || isDeleting}
          className="flex flex-col gap-6"
        >
          <input type="hidden" name="intent" value="save" />
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              ref={nameRef}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={true}
              type="text"
              name="name"
              id="name"
              placeholder="Name"
              defaultValue={document?.name}
            />
            {fetcher?.data?.errors?.name ? (
              <p
                className="pt-1 text-red-500 text-sm font-medium leading-none"
                id="url-error"
              >
                {fetcher.data.errors.name}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            {document.content ? (
              <>
                <Textarea
                  ref={contentRef}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={true}
                  placeholder="Type your message here."
                  id="content"
                  name="content"
                  rows={16}
                  defaultValue={document.content}
                />
                {fetcher?.data?.errors?.content ? (
                  <p
                    className="pt-1 text-red-500 text-sm font-medium leading-none"
                    id="url-error"
                  >
                    {fetcher.data.errors.content}
                  </p>
                ) : null}
              </>
            ) : (
              <Skeleton count={10} />
            )}
          </div>
        </fieldset>
      </Form>
      {/* </div> */}
    </Container>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  breadcrumb: "data",
};
