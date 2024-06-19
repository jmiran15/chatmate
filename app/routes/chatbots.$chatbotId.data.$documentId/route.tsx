import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  deleteDocumentById,
  getDocumentById,
  updateDocumentById,
} from "~/models/document.server";
import { useToast } from "~/components/ui/use-toast";
import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { queue } from "~/queues/ingestion.server";
import { usePendingDocuments } from "../chatbots.$chatbotId.data._index/hooks/use-pending-documents";
import Skeleton from "react-loading-skeleton";
import { useDocumentProgress } from "../chatbots.$chatbotId.data._index/hooks/use-document-progress";
import { ProgressData } from "../api.chatbot.$chatbotId.data.progress";
import { useEventSource } from "remix-utils/sse/react";

// TODO - account for optimistic UI, i.e. we could have got here with the data in the fetchers but not yet in the db
// TODO - we also need to carry forward the optimistic ui (CRUD)
// TODO - make deletion optimistic
// TODO - defer the intial loading - with skeletons
// TODO - if we don't have the body - show skeleton
// TODO - show ingestion status - (percentage, etc...)

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

  switch (intent) {
    case "delete": {
      await deleteDocumentById({ id: documentId });
      return redirect(`/chatbots/${params.chatbotId}/data?index`);
    }
    case "save": {
      const name = formData.get("name") as string;
      const content = formData.get("content") as string;
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
      });
    }
    default: {
      throw new Error("Invalid action");
    }
  }
};

export default function DocumentPage() {
  const { toast } = useToast();
  const fetcher = useFetcher<typeof action>();
  const { chatbotId, documentId } = useParams();
  const { document } = useLoaderData<typeof loader>();
  const pendingDocuments = usePendingDocuments();
  const optimisticDocument = pendingDocuments.find(
    (document) => document.id === documentId,
  );
  const eventSource = useEventSource(`/api/chatbot/${chatbotId}/data/progress`);
  const progress: ProgressData | undefined = useMemo(() => {
    return eventSource ? JSON.parse(eventSource) : undefined;
  }, [eventSource]);
  const { status, content } = useDocumentProgress(
    document || optimisticDocument,
    progress,
  );

  const isSaving =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("intent") === "save";
  const isDeleting =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("intent") === "delete";
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data?.intent === "save" &&
      fetcher.data?.document
    ) {
      toast({
        title: "Success",
        description: "Document was successfully saved",
      });
    }
  }, [fetcher]);

  if (!document && !optimisticDocument) {
    throw new Error("Document not found");
  }

  const optimisticDocumentName =
    fetcher.formData && String(fetcher.formData.get("intent")) === "save"
      ? String(fetcher.formData.get("name"))
      : document?.name || optimisticDocument?.name;

  console.log("content", { content });
  return (
    <div className="flex flex-col p-4 gap-8 w-full h-full overflow-y-auto">
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
          <h1 className="flex-1 whitespace-nowrap text-xl font-semibold tracking-tight text-ellipsis">
            {optimisticDocumentName}
          </h1>
          <Badge variant="secondary" className="ml-auto sm:ml-0">
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              fetcher.submit({ intent: "delete" }, { method: "post" })
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
              type="text"
              name="name"
              id="name"
              placeholder="Name"
              defaultValue={document?.name || optimisticDocument?.name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            {typeof content === "string" ? (
              <Textarea
                placeholder="Type your message here."
                id="content"
                name="content"
                rows={16}
                defaultValue={content}
              />
            ) : (
              content
            )}
          </div>
        </fieldset>
      </Form>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  breadcrumb: "data",
};
