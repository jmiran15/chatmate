import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { BanknotesIcon, QueueListIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Form, useParams } from "@remix-run/react";
import { Button } from "../ui/button";

const items = [
  {
    name: "Features overview",
    description: "What features do you offer?",
    iconColor: "bg-pink-500",
    icon: QueueListIcon,
  },
  {
    name: "Pricing",
    description: "Can you give me a detailed breakdown of your pricing?",
    iconColor: "bg-purple-500",
    icon: BanknotesIcon,
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function TestChatbotIndex() {
  const { chatbotId } = useParams();
  return (
    <Card className="rounded-sm max-w-xl">
      <CardHeader>
        <CardTitle>Test your chatbot</CardTitle>
        <CardDescription>
          This is where you can chat with your chatbot and make sure it's
          working as expected. Get started by trying out some sample
          conversations or create your own.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>
              <div className="group relative flex items-start space-x-3 py-4">
                <div className="flex-shrink-0">
                  <span
                    className={classNames(
                      item.iconColor,
                      "inline-flex h-10 w-10 items-center justify-center rounded-lg",
                    )}
                  >
                    <item.icon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <div className="min-w-0 flex-1 flex flex-col items-start">
                  <Form
                    method="post"
                    className="text-sm font-medium text-gray-900 "
                    action={`/chatbots/${chatbotId}/chat`}
                  >
                    <input type="hidden" name="action" value="create" />
                    <input
                      type="hidden"
                      name="userMessage"
                      value={item.description}
                    />
                    <Button
                      type="submit"
                      className="w-full p-0 m-0 h-0 "
                      variant={"link"}
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      {item.name}
                    </Button>
                  </Form>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="flex-shrink-0 self-center">
                  <ChevronRightIcon
                    className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Form
          method="post"
          className="w-full"
          action={`/chatbots/${chatbotId}/chat`}
        >
          <input type="hidden" name="action" value="create" />
          <Button
            type="submit"
            className="text-sm font-medium  h-0 p-0"
            variant={"link"}
          >
            Or create your own conversation
            <span aria-hidden="true"> &rarr;</span>
          </Button>
        </Form>
      </CardFooter>
    </Card>
  );
}
