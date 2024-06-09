import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import DocumentCard from "~/routes/chatbots.$chatbotId.data._index/document-card";
import {
  createDocument,
  createDocuments,
  getDocumentsByChatbotId,
} from "~/models/document.server";
import { convertUploadedFilesToDocuments } from "~/utils/llm/openai";
import { getDocuments } from "~/utils/webscraper/scrape";
import { Document, FullDocument } from "~/utils/types";
import { DialogDemo } from "./modal";
import { useEffect } from "react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { PaginationBar } from "./pagination-bar";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { chatbotId } = params;
  const url = new URL(request.url);
  const $top = Number(url.searchParams.get("$top")) || 5;
  const $skip = Number(url.searchParams.get("$skip")) || 0;
  const userId = await requireUserId(request);

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
  });

  if (chatbot?.userId !== userId) {
    throw new Error("User does not have access to chatbot");
  }

  const [total, documents] = await prisma.$transaction([
    prisma.document.count({
      where: { chatbotId },
    }),
    prisma.document.findMany({
      where: { chatbotId },
      orderBy: { createdAt: "desc" },
      skip: $skip,
      take: $top,
    }),
  ]);

  const documents_ = await getDocumentsByChatbotId({ id: chatbotId });

  return json({
    total,
    documents,
    documents_: documents_,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  switch (intent) {
    case "getLinks": {
      const url = String(formData.get("url"));

      const links = await getDocuments([url], "crawl", 100, true);
      return json({ intent, links });
    }
    case "crawlLinks": {
      let links = JSON.parse(formData.get("links") as string);
      links = links.map((link: Document) => link.metadata.sourceURL);

      const documents = await getDocuments(links, "single_urls", 100, false);

      return json({ intent, documents });
    }
    case "parseFiles": {
      // do same parallel stuff that we do in the scrapeLinks action

      // Get all file entries from the original formData
      const files = formData.getAll("files");

      const documents: FullDocument[] =
        await convertUploadedFilesToDocuments(files);

      return json({ intent, documents });
    }
    case "createDocument": {
      const content = String(formData.get("content"));
      const name = String(formData.get("name"));
      const document = await createDocument({ name, content, chatbotId });

      // enqueue a ingestion job - bullmq

      return redirect(`/chatbots/${chatbotId}/data`);
    }
    case "createDocuments": {
      const documents = JSON.parse(String(formData.get("documents"))).map(
        (document: FullDocument) => ({
          name: document.name,
          content: document.content,
          chatbotId,
        }),
      );
      const createdDocuments = await createDocuments({ documents });

      // enqueue a batch of ingestion jobs - bullmq

      return redirect(`/chatbots/${chatbotId}/data`);
    }

    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};

export default function Data() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  console.log(data.documents_);

  useEffect(() => {
    if (searchParams.get("step")) {
      setSearchParams({});
    }
  }, []);

  return (
    <div className="flex flex-col p-4 gap-8 w-full h-full overflow-y-auto">
      <div className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">Data</h1>
          <h1 className="text-sm text-muted-foreground">
            This is the data that your chatbot will be able to reference in it's
            responses
          </h1>
        </div>
        <DialogDemo />
      </div>

      {data.documents.length === 0 ? (
        <p className="p-4">No documents yet</p>
      ) : (
        <ol className="space-y-4 ">
          {data.documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </ol>
      )}
      <PaginationBar total={data.total} />
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  breadcrumb: "data",
};
