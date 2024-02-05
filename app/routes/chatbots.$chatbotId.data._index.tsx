import { Document } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import DocumentCard from "~/components/DocumentCard";
import {
  createDocuments,
  getDocumentsByChatbotId,
  processFiles,
} from "~/models/document.server";

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
};

export default function Data() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-2 w-full px-24 py-12">
      <h1 className="text-2xl font-bold">Data</h1>
      <h1 className="font-normal text-gray-700 dark:text-gray-400">
        This is the data that your chatbot will be able to reference in it's
        responses
      </h1>

      <Form method="post" encType="multipart/form-data">
        <input
          type="file"
          name="file"
          multiple
          className="block w-full text-sm text-gray-500
                               file:mr-4 file:rounded file:border-0
                               file:bg-blue-50 file:py-2 file:px-4
                               file:text-sm file:font-semibold
                               file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          className="mt-2 flex items-center justify-center rounded-md bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600"
        >
          + Upload Document
        </button>
      </Form>

      {data.documents.length === 0 ? (
        <p className="p-4">No documents yet</p>
      ) : (
        <ol className="space-y-4 ">
          {data.documents.map((document) => (
            <li key={document.id}>
              <DocumentCard document={document} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export const handle = {
  breadcrumb: "data",
};
