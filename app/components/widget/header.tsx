import { Form, useParams } from "@remix-run/react";
import { RefreshCcw } from "lucide-react";
import { CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Chatbot } from "@prisma/client";

export default function WidgetHeader({ chatbot }: { chatbot: Chatbot }) {
  const { chatbotId } = useParams();
  return (
    <CardHeader className="flex flex-row items-center">
      <div className="flex items-center space-x-4">
        <div>
          <p className="text-sm font-medium leading-none">
            {chatbot.publicName}
          </p>
          <p className="text-sm text-muted-foreground">{chatbot.bio}</p>
        </div>
      </div>

      <Form method="post" action="/clear" className="ml-auto">
        <input type="hidden" name="chatbotId" value={chatbotId} />
        <Button
          size="icon"
          variant="outline"
          className="rounded-full"
          type="submit"
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>
      </Form>
    </CardHeader>
  );
}
