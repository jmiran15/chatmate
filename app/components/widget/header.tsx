import { Form, useParams } from "@remix-run/react";
import { RefreshCcw, X } from "lucide-react";

export default function WidgetHeader({ close }: { close: () => void }) {
  const { chatbotId } = useParams();
  return (
    <div className="flex items-center justify-between bg-indigo-500 p-5 rounded-t-2xl">
      <div className="flex items-center">
        <img
          src="https://s3-alpha.figma.com/hub/file/1913095808/a7bdc469-cd70-4ea1-bb57-b59204ad8182-cover.png"
          alt="Chatmate"
          className="h-6 w-6 rounded-full mr-2"
        />
        <span className="text-white font-medium">Chatmate</span>
      </div>
      <div className="flex items-center">
        <Form method="post" action="/clear">
          <input type="hidden" name="chatbotId" value={chatbotId} />
          <button
            type="submit"
            className="text-white hover:text-opacity-80 transition ease-in-out duration-150"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </Form>
        <button
          className="text-white hover:text-opacity-80 transition ease-in-out duration-150 ml-2"
          onClick={close}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
