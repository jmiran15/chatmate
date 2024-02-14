import { useParams } from "@remix-run/react";
import CodeBlock from "~/components/code-block";

export default function Share() {
  const { chatbotId } = useParams();
  return (
    <div className="flex flex-col h-full w-full p-8 gap-4">
      <p className="text-muted-foreground">
        To add the chatbot any where on your website, add this iframe to your
        html code
      </p>
      <CodeBlock
        code={`
        <iframe
        src=http://chatmate.dev/${chatbotId}/widget
        width="100%"
        height="100%"
        allowFullScreen
        title="chatbot-preview"/>`}
        language="html"
      />
    </div>
  );
}

export const handle = {
  breadcrumb: "share",
};
