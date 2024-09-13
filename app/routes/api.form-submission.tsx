import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function loader() {
  const corsHeader =
    process.env.NODE_ENV === "production"
      ? {
          "Access-Control-Allow-Origin": "*",
        }
      : {};
  const headers = {
    ...corsHeader,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as HeadersInit;
  return json({ success: true }, { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const { formId, messageId, submissionData } = await request.json();

  console.log("submittion form with ", formId, messageId, submissionData);

  const updatedMessage = await prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      formSubmission: {
        create: {
          formId: formId,
          submissionData: submissionData,
        },
      },
    },
    include: {
      form: true,
      formSubmission: true,
    },
  });

  console.log("updatedMessage", updatedMessage);

  const corsHeader =
    process.env.NODE_ENV === "production"
      ? {
          "Access-Control-Allow-Origin": "*",
        }
      : {};
  const headers = {
    ...corsHeader,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as HeadersInit;

  return json(
    {
      updatedMessage: updatedMessage,
    },
    { headers },
  );
}
