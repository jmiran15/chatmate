import { useParams } from "@remix-run/react";
import CodeBlock from "~/components/code-block";

export default function Share() {
  const { chatbotId } = useParams();
  return (
    <div className="flex flex-col h-full w-full p-8 gap-4">
      <p className="text-muted-foreground">
        To add the chatbot any where on your website, add this iframe and script
        tag to your html code
      </p>
      <CodeBlock
        code={`<iframe
id="chatmate-chatbot-widget-iframe"
style="
position: fixed;
bottom: 8px;
right: 8px;
width: 80px;
height: 80px;
border: none;
z-index: 1000;"
src={https://chatmate.fly.dev/${chatbotId}/widget}
title="chatbot-preview"
></iframe>
<script src="https://chatmate.fly.dev/iframeResizer.js"></script>`}
      />
    </div>
  );
}

export const handle = {
  breadcrumb: "share",
};
