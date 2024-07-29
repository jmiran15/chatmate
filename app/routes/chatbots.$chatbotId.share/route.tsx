import { useParams } from "@remix-run/react";
import CopyEmbedCode from "~/components/share/code";
import HowTo from "~/components/share/how-to";

export default function Share() {
  const { chatbotId } = useParams();
  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 overflow-y-auto">
      <CopyEmbedCode
        code={`<script data-chatmate-widget-script="true" data-embed-id="${chatbotId}" src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"></script>`}
      />
      <HowTo />
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/share`,
  breadcrumb: "share",
};
