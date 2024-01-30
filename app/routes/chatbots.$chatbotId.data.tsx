import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { processFiles } from "~/models/document.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const f = formData.getAll("file"); // Assuming "file" is the name attribute in your input field

  const { files } = await processFiles({ files: f });

  console.log({ files });

  return json({ files });
};

export default function Data() {
  const actionData = useActionData<typeof action>();

  console.log({ stuff: actionData });

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

      {/* {data.chatbots.length === 0 ? (
        <p className="p-4">No chatbots yet</p>
      ) : (
        <ol className="space-y-4 ">
          {data.chatbots.map((chatbot) => (
            <li key={chatbot.id}>
              <ChatbotCard chatbot={chatbot} />
            </li>
          ))}
        </ol>
      )} */}
    </div>
  );
}
