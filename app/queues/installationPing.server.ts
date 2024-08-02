import type { Chatbot } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { repeat } from "~/routes/api.$chatbotId.installed";
import { Queue } from "~/utils/queue.server";
import axios, { isAxiosError } from "axios";
import { JSDOM } from "jsdom";

export interface InstallationPingQueueData {
  chatbotId: string;
}

export const installationPingQueue = Queue<InstallationPingQueueData>(
  "installationPing",
  async (
    job,
  ): Promise<
    Pick<Chatbot, "id" | "embeddedOn" | "installed" | "lastPingedAt">
  > => {
    const { chatbotId } = job.data;
    invariant(chatbotId, "Chatbot ID is required");
    console.log(
      `installationPingQueue - checking installation for chatbotId: ${chatbotId}`,
    );
    return checkInstallation({ chatbotId });
  },
);

export async function checkInstallation({
  chatbotId,
}: {
  chatbotId: string;
}): Promise<Pick<Chatbot, "id" | "embeddedOn" | "installed" | "lastPingedAt">> {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    select: { id: true, embeddedOn: true, installed: true, lastPingedAt: true },
  });

  if (!chatbot || !chatbot.embeddedOn) {
    return {
      id: chatbotId,
      embeddedOn: null,
      installed: false,
      lastPingedAt: null,
    };
  }

  try {
    const response = await axios.get(chatbot.embeddedOn, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const html = response.data;

    // Use JSDOM to parse the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Find all script tags and convert to array of HTMLScriptElement
    const scripts = Array.from(
      document.querySelectorAll("script"),
    ) as HTMLScriptElement[];

    // Check if any script tag matches our criteria
    const isInstalled = scripts.some((script) => {
      return (
        script.getAttribute("data-embed-id") === chatbotId &&
        script.getAttribute("src")?.includes("chatmate-chat-widget.js")
      );
    });

    console.log("installationPingQueue - isInstalled: ", isInstalled);

    if (isInstalled) {
      console.log(
        `installationPingQueue - chatbotId: ${chatbotId} is installed`,
      );
      return await prisma.chatbot.update({
        where: { id: chatbotId },
        data: { lastPingedAt: new Date() },
        select: {
          id: true,
          embeddedOn: true,
          installed: true,
          lastPingedAt: true,
        },
      });
    } else {
      console.log(
        `installationPingQueue - chatbotId: ${chatbotId} is not installed`,
      );
      await installationPingQueue.removeRepeatable(
        `installationPingQueue-${chatbotId}`,
        repeat,
      );
      return await prisma.chatbot.update({
        where: { id: chatbotId },
        data: { installed: false, embeddedOn: null },
        select: {
          id: true,
          embeddedOn: true,
          installed: true,
          lastPingedAt: true,
        },
      });
    }
  } catch (error) {
    console.error(`Failed to check installation for ${chatbotId}:`, error);
    if (isAxiosError(error) && error.response?.status === 403) {
      console.log(
        `Access forbidden for ${chatbot.embeddedOn}. Possible CORS issue.`,
      );
    }
    console.log(`Setting isInstalled to false due to failed GET request`);
    return await prisma.chatbot.update({
      where: { id: chatbotId },
      data: { installed: false, embeddedOn: null },
      select: {
        id: true,
        embeddedOn: true,
        installed: true,
        lastPingedAt: true,
      },
    });
  }
}
