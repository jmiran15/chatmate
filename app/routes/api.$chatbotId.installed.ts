import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import {
  checkInstallation,
  installationPingQueue,
} from "~/queues/installationPing.server";

export const repeat = {
  pattern: "0 15 3 * * *",
};

export async function loader({ params }: LoaderFunctionArgs) {
  // the loader function should just return the installation status - call the same function we call in the cron job
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  const chatbot = await checkInstallation({ chatbotId });

  const headers = {
    // "Access-Control-Allow-Origin": "*", // Allow any domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  return json({ chatbot }, { headers });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const body = JSON.parse(await request.text());
  const { chatbotId } = params;
  const { lastPingedAt, embeddedOn } = body;

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  // update the chatbot data
  const chatbot = await prisma.chatbot.update({
    where: { id: chatbotId },
    data: { lastPingedAt, embeddedOn, installed: true },
  });

  await installationPingQueue.add(
    `installationPingQueue-${chatbotId}`,
    { chatbotId },
    {
      repeat,
    },
  );

  const headers = {
    // "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  return json({ chatbot }, { headers });
}
