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
        code={`
        <iframe
        id="chatmate-chatbot-widget-iframe"
        style={{
          position: "fixed",
          bottom: "8px",
          right: "8px",
          zIndex: 50,
          height: "80px",
          width: "80px",
        }}
        src="http://chatmate.dev/${chatbotId}/widget"
        title="chatbot-preview"
        />
        <script src="chatmate.dev/iframeResizer.js"></script>
        `}
        language="html"
      />
    </div>
  );
}

export const handle = {
  breadcrumb: "share",
};
