import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { getDocumentById, updateDocumentById } from "~/models/document.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const id = params.documentId as string;
  const name = formData.get("name") as string;
  const content = formData.get("content") as string;

  // here we need to update the embeddings of that document

  // reembed the entire document
  // 1. delete its prev Embedding objects
  // 2. add new Embedding objects
  return await updateDocumentById({ id, name, content });
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.documentId as string;
  const document = await getDocumentById({ id });
  return json({ document });
};

export default function ModelC() {
  const data = useLoaderData<typeof loader>();

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        padding: "2rem",
      }}
    >
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Name: </span>
          <input
            defaultValue={data ? data.document!.name : undefined}
            name="name"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
          />
        </label>
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Content: </span>
          <textarea
            defaultValue={data ? (data.document!.content as string) : undefined}
            name="content"
            rows={16}
            className="w-full flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
          />
        </label>
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </Form>
  );
}
