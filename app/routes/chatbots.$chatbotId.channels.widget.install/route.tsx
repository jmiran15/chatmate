import { useLoaderData, useParams } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import CopyEmbedCode from "./code";
import HowTo from "./how-to";
import { useState, useEffect } from "react";
import { checkInstallation } from "~/queues/installationPing.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface InstallationStatusProps {
  isInstalled: boolean;
}

export function InstallationStatus({ isInstalled }: InstallationStatusProps) {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Installation status</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <div className="relative w-2 h-2">
          <div
            className={`animate-[pulsate_1s_ease-out_infinite] opacity-0 absolute h-2 w-2 rounded-full ${
              isInstalled ? "bg-green-600" : "bg-yellow-600"
            }`}
          ></div>
          <div
            className={`h-2 w-2 absolute rounded-full ${
              isInstalled ? "bg-green-600" : "bg-yellow-600"
            }`}
          ></div>
        </div>
        <div>
          {isInstalled
            ? "Your chatbot has been installed successfully!"
            : "Your chatbot is not installed yet."}
        </div>
      </CardContent>
    </Card>
  );
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  const chatbot = await checkInstallation({ chatbotId });

  console.log("chatbot from initial check: ", chatbot);

  return json({ chatbot });
};

export default function Share() {
  const { chatbotId } = useParams();
  const { chatbot } = useLoaderData<typeof loader>();
  const [installationStatus, setInstallationStatus] = useState(
    chatbot.installed,
  );

  console.log("installationStatus: ", installationStatus);

  useEffect(() => {
    const checkStatus = async () => {
      if (!installationStatus) {
        // If not installed, check the chatbot status
        const response = await fetch(`/api/chatbot/${chatbotId}`);
        const data = await response.json();
        setInstallationStatus(data.installed);
      } else {
        // If installed, run the checkInstallation function
        const response = await fetch(`/api/${chatbotId}/installed`);
        const data = await response.json();
        setInstallationStatus(data.chatbot.installed);
      }
    };

    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [chatbotId, installationStatus]);

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 overflow-y-auto">
      <InstallationStatus isInstalled={installationStatus} />
      <CopyEmbedCode
        code={`<script data-chatmate-widget-script="true" data-embed-id="${chatbotId}" src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"></script>`}
      />
      <HowTo />
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/channels/widget/install`,
  breadcrumb: "install",
};
