import { useParams } from "@remix-run/react";
import CodeBlock from "~/components/code-block";

export default function Share() {
  const { chatbotId } = useParams();
  return (
    <div className="flex flex-col h-full w-full p-4 gap-4">
      <p className="text-muted-foreground">
        To add the chatbot any where on your website, add this iframe and script
        tag to your html code
      </p>
      <CodeBlock
        code={`<script
          data-embed-id="${chatbotId}"
          src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"
        ></script>`}
      />
    </div>
  );
}

export const handle = {
  breadcrumb: "share",
};
