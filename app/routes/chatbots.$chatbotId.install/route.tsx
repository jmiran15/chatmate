import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { NonLinkCard } from "~/components/LinkCard";
import { LinkCardHeader } from "~/components/LinkCardHeader";
import { Separator } from "~/components/ui/separator";
import { checkInstallation } from "~/queues/installationPing.server";
import CopyEmbedCode from "../chatbots.$chatbotId.channels.widget.install/code";
import HowTo from "../chatbots.$chatbotId.channels.widget.install/how-to";
import Container from "../chatbots.$chatbotId.forms._index/Container";
import Description from "../chatbots.$chatbotId.forms._index/Description";
import Title from "../chatbots.$chatbotId.forms._index/Title";

interface InstallationStatusProps {
  isInstalled: boolean;
}

export function InstallationStatus({ isInstalled }: InstallationStatusProps) {
  return (
    <NonLinkCard className="w-full max-w-2xl">
      <div className="p-4 flex flex-col gap-1">
        <LinkCardHeader title={"Installation status"} tag={undefined} />
        <div className="relative flex items-center gap-2">
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
          <div className="text-sm text-muted-foreground line-clamp-2">
            {isInstalled
              ? "Your chatbot has been installed successfully!"
              : "Your chatbot is not installed yet."}
          </div>
        </div>
      </div>
    </NonLinkCard>
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
    <Container className="max-w-5xl">
      <Header />
      <Separator />
      <div className="flex flex-col gap-4">
        <InstallationStatus isInstalled={installationStatus} />
        <CopyEmbedCode
          code={`<script type="module" data-chatmate-widget-script="true" data-embed-id="${chatbotId}" src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js" async></script>`}
        />
        <HowTo />
      </div>
    </Container>
  );
}

function Header() {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between">
      <div className="flex flex-col">
        <Title>Installation</Title>
        <Description>
          Install your chatbot on your website to start receiving messages.
        </Description>
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/install`,
  breadcrumb: "install",
};
