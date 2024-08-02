import { useLoaderData, useParams } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import CopyEmbedCode from "./code";
import HowTo from "./how-to";
import { useState, useEffect } from "react";
import { checkInstallation } from "~/queues/installationPing.server";

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
      <InstallationStatus installationStatus={installationStatus} />
      <CopyEmbedCode
        code={`<script data-chatmate-widget-script="true" data-embed-id="${chatbotId}" src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"></script>`}
      />
      <HowTo />
    </div>
  );
}

function InstallationStatus({
  installationStatus,
}: {
  installationStatus: boolean;
}) {
  return <div>{installationStatus ? "Installed" : "Not installed"}</div>;
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/channels/widget/install`,
  breadcrumb: "install",
};
