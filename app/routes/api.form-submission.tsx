import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { getIO } from "~/utils/socketmanager.server";
import { processAction } from "./api.chat.$chatbotId.$sessionId/customFlows.server";

// TODO: At the moment this will only work properly if the action depends on a single form.
// TODO: For now, in the FLOW EDITOR, lets make it so that the actions following a form, can only refer to that form, so actions will only ever reference one form.

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
  const { flowId, formId, messageId, submissionData, chatId } =
    await request.json();

  console.log(
    "submittion form with ",
    flowId,
    formId,
    messageId,
    submissionData,
  );

  // example -> submittion form with  ... ... ... { field_1727290446884: 'jon@jt.com' }

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
      form: {
        include: {
          elements: true,
        },
      },
      formSubmission: true,
    },
  });

  console.log("updatedMessage", updatedMessage);

  /**
   * Okay, so here we have a formId, and a messageId
   * We also need the actionId or maybe the flowId?
   *
   *
   * lets just pass flowId to message (optional field... only when message is created via customFlow call), save in widget state and db
   * then send here on form submission call
   *
   * We can then findMany FormsOnActions where the action is of the flow and formId, and order them by the order.
   *
   *
   * Then for now ... send all those messages one by one with their delays ... essentially call "processAction" from customFlows.server.ts
   */

  const pendingRelations = await prisma.formsOnActions.findMany({
    where: {
      action: {
        flowId: flowId,
        type: "TEXT",
      },
      formId: formId,
    },
    orderBy: {
      action: {
        order: "asc",
      },
    },
    include: {
      action: true,
    },
  });

  const io = getIO();

  // process sequentially
  for (const relation of pendingRelations) {
    console.log("relation.action", relation.action);

    const processedAction = {
      ...relation.action,
      text: relation.action.text!.replace(
        /@\[([^\]]+)\]\([^\)]+\)/g,
        (match, fieldName) => {
          const value = submissionData[fieldName];
          return value !== undefined ? value : match;
        },
      ),
    };

    console.log("processedAction", processedAction);

    await processAction(processedAction, chatId, io);
  }

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
