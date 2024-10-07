import { ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  BeakerIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";
import { Link, useParams } from "@remix-run/react";
import { cn } from "~/lib/utils";
import { useMobileScreen } from "~/utils/mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

const items = [
  {
    name: "Add your documents",
    description:
      "Allow your chatbot to answer customer questions with your business information.",
    href: "#",
    iconColor: "bg-pink-500",
    icon: DocumentDuplicateIcon,
    path: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  },
  {
    name: "Test your chatbot",
    description:
      "Test your chatbot by chatting with it and making sure it's working as expected.",
    iconColor: "bg-purple-500",
    icon: BeakerIcon,
    path: (chatbotId: string) => `/chatbots/${chatbotId}/chat`,
  },
  {
    name: "Customize your widget",
    description:
      "Customize your chatbot widget to make it look and feel just the way you want it.",
    iconColor: "bg-green-500",
    icon: PaintBrushIcon,
    path: (chatbotId: string) => `/chatbots/${chatbotId}/appearance`,
  },
  {
    name: "Share your chatbot",
    description:
      "Embed your chatbot widget on your website to start engaging with your customers.",
    iconColor: "bg-yellow-500",
    icon: CodeBracketIcon,
    path: (chatbotId: string) => `/chatbots/${chatbotId}/install`,
  },
];

export default function InboxIndexLg() {
  const isMobile = useMobileScreen();
  const { chatbotId } = useParams();

  if (isMobile || !chatbotId) {
    return null;
  }

  return (
    <Card className="rounded-sm max-w-xl">
      <CardHeader>
        <CardTitle>Let's get you setup.</CardTitle>
        <CardDescription>
          Get the most out of your chatbot by following these setup steps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>
              <div className="group relative flex items-start space-x-3 py-4">
                <div className="flex-shrink-0">
                  <span
                    className={cn(
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
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    <Link to={item.path(chatbotId)}>
                      <span className="absolute inset-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </div>
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
    </Card>
  );
}
