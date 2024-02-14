import { Document } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import DocumentCard from "~/components/document-card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  createDocuments,
  getDocumentsByChatbotId,
  processFiles,
} from "~/models/document.server";
import seed from "~/utils/seed";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  // fetch documents from database by chatbotid
  const chatbotId = params.chatbotId as string;

  // if (!chatbotId) {
  //   return json({ error: "Chatbot id is required" }, { status: 400 });
  // }

  const documents = await getDocumentsByChatbotId({ chatbotId });

  return json({ documents });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  switch (action) {
    case "scrape": {
      // scrape and save documents and embeddings
      const url = formData.get("url") as string;
      return await seed(
        url,
        3,
        {
          splittingMethod: "markdown",
          chunkSize: 256,
          chunkOverlap: 1,
        },
        params.chatbotId as string,
      );
    }
    case "upload": {
      const files = formData.getAll("file");
      const fileContents = await processFiles({ files });
      const chatbotId = params.chatbotId as string;

      const documents: Pick<Document, "name" | "content" | "chatbotId">[] =
        fileContents.map((fileContent) => ({
          ...fileContent,
          chatbotId,
        }));

      // this creates the embeddings as well
      await createDocuments({ documents }); // these are the documents that will be shown in the UI

      return json({ fileContents });
    }
    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};

export default function Data() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-8 w-full p-6 md:px-24 ">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Data</h1>
        <h1 className="font-normal text-gray-700 dark:text-gray-400">
          This is the data that your chatbot will be able to reference in it's
          responses
        </h1>

        <Form
          method="post"
          encType="multipart/form-data"
          className="flex flex-row justify-between items-center gap-4"
        >
          <input type="hidden" name="action" value="scrape" />
          <Input
            type="text"
            name="url"
            placeholder="Enter website url"
            multiple
            className="flex-1"
          />
          <Button type="submit" className="flex-none">
            Scrape website
          </Button>
        </Form>

        <Form
          method="post"
          encType="multipart/form-data"
          className="flex flex-row justify-between items-center gap-4"
        >
          <input type="hidden" name="action" value="upload" />
          <Input type="file" name="file" multiple className="flex-1" />
          <Button type="submit" className="flex-none">
            + Upload Document
          </Button>
        </Form>
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
    </div>
  );
}

export const handle = {
  breadcrumb: "data",
};
