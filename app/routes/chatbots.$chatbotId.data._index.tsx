import { Document } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigation,
  useParams,
} from "@remix-run/react";
import DocumentCard from "~/components/document-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  createDocuments,
  getDocumentsByChatbotId,
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
      return await seed(url, 5, params.chatbotId as string);
    }
    case "upload": {
      const newFormData = new FormData();

      // Get all file entries from the original formData
      const files = formData.getAll("file");

      // Append each file to the new FormData instance
      files.forEach((file) => {
        newFormData.append("files", file);
      });

      const response = await fetch(
        "https://chatmatedev-0tyi7426.api.unstructuredapp.io/general/v0/general",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "unstructured-api-key": process.env.UNSTRUCTURED_API_KEY as string,
          },
          body: newFormData,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to partition file with error ${
            response.status
          } and message ${await response.text()}`,
        );
      }

      const elements = await response.json();
      if (!Array.isArray(elements)) {
        throw new Error(
          `Expected partitioning request to return an array, but got ${elements}`,
        );
      }

      const fileContents: { name: string; content: string }[] =
        elements[0].constructor === Array
          ? elements.map((fileElements) => {
              return {
                name: fileElements[0].metadata.filename,
                content: fileElements.map((element) => element.text).join("\n"),
              };
            })
          : [
              {
                name: elements[0].metadata.filename,
                content: elements.map((element) => element.text).join("\n"),
              },
            ];

      const chatbotId = params.chatbotId as string;

      const documents: Pick<Document, "name" | "content" | "chatbotId">[] =
        fileContents.map((fileContent) => ({
          ...fileContent,
          chatbotId,
        }));

      await createDocuments({ documents }); // these are the documents that will be shown in the UI

      return json({ fileContents });
    }
    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};

const SUPPORTED_FILE_TYPES = [
  "txt",
  "eml",
  "msg",
  "xml",
  "html",
  "md",
  "rst",
  "json",
  "rtf",
  "jpeg",
  "png",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "pdf",
  "odt",
  "epub",
  "csv",
  "tsv",
  "xlsx",
  "gz",
];

export default function Data() {
  const data = useLoaderData<typeof loader>();
  const { chatbotId } = useParams();
  const navigation = useNavigation();
  const isSubmitting =
    navigation.formAction === `/chatbots/${chatbotId}/data?index`;

  return (
    <div className="flex flex-col gap-8 w-full px-24 py-12 overflow-y-auto h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Data</h1>
        <h1 className="font-normal text-gray-700 dark:text-gray-400">
          This is the data that your chatbot will be able to reference in it's
          responses
        </h1>

        <Form method="post" encType="multipart/form-data">
          <fieldset
            disabled={isSubmitting}
            className="flex flex-row justify-between items-center gap-4"
          >
            <input type="hidden" name="action" value="scrape" />
            <Input
              type="text"
              name="url"
              placeholder="Enter website url, e.g. https://example.com"
              multiple
              className="flex-1"
            />
            <Button type="submit" className="flex-none">
              Scrape website
            </Button>
          </fieldset>
        </Form>

        <Form
          method="post"
          encType="multipart/form-data"
          className="flex flex-col gap-4"
        >
          <fieldset
            disabled={isSubmitting}
            className="flex flex-row justify-between items-center gap-4"
          >
            <input type="hidden" name="action" value="upload" />
            <Input type="file" name="file" multiple className="flex-1" />
            <Button type="submit" className="flex-none">
              + Upload Document
            </Button>
          </fieldset>

          <div className="flex flex-row gap-1 flex-wrap">
            <span className="text-sm font-normal text-gray-700">
              Supported file types:
            </span>
            {SUPPORTED_FILE_TYPES.map((fileType, index) => (
              <Badge key={index} variant="secondary">
                {fileType}
              </Badge>
            ))}
          </div>
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
