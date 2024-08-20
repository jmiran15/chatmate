import { Link, useParams } from "@remix-run/react";

export default function InboxIndexMd() {
  const { chatbotId } = useParams();

  return (
    <div className="flex flex-col space-y-1.5">
      <p className="text-sm text-muted-foreground">
        This is where you will see all incoming messages from your customers.
        Need help getting started?
      </p>
      <Link
        to={`/chatbots/${chatbotId}/data`}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Add your documents
        <span aria-hidden="true"> &rarr;</span>
      </Link>
      <Link
        to={`/chatbots/${chatbotId}/chat`}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Test your chatbot
        <span aria-hidden="true"> &rarr;</span>
      </Link>
      <Link
        to={`/chatbots/${chatbotId}/channels/widget/appearance`}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Customize your widget
        <span aria-hidden="true"> &rarr;</span>
      </Link>
      <Link
        to={`/chatbots/${chatbotId}/channels/widget/install`}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Add to your website
        <span aria-hidden="true"> &rarr;</span>
      </Link>
    </div>
  );
}
