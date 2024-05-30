import { Link, useMatches, useParams } from "@remix-run/react";
import {
  AreaChart,
  Brush,
  Database,
  MessageSquareMore,
  MessagesSquare,
  Settings,
  Share,
} from "lucide-react";
import { cn, isActive } from "~/lib/utils";

export default function Sidebar() {
  const matches = useMatches();
  const { chatbotId } = useParams();

  if (!chatbotId) {
    return null;
  }

  const links = [
    {
      title: "Chats",
      path: `/chatbots/${chatbotId}/chats`,
      icon: MessagesSquare,
      navigate: true,
    },
    {
      title: "Data",
      path: `/chatbots/${chatbotId}/data`,
      icon: Database,
      navigate: true,
    },
    {
      title: "Appearance",
      path: `/chatbots/${chatbotId}/appearance`,
      icon: Brush,
      navigate: true,
    },
    {
      title: "Share",
      path: `/chatbots/${chatbotId}/share`,
      icon: Share,
      navigate: true,
    },
    {
      title: "Analytics",
      path: `/chatbots/${chatbotId}/analytics`,
      icon: AreaChart,
      navigate: true,
    },
    {
      title: "Chat",
      path: `/chatbots/${chatbotId}/chat`,
      icon: MessageSquareMore,
      navigate: true,
    },
    {
      title: "Settings",
      path: `/chatbots/${chatbotId}/settings`,
      icon: Settings,
      navigate: true,
    },
  ];

  return (
    // large and medium screens
    <div className="hidden border-r bg-muted/40 lg:block">
      <div className="flex flex-col h-full max-h-screen gap-2">
        <nav className="grid items-start p-2 text-sm font-medium lg:p-4 ">
          {links.map((link, index) => (
            <Link
              id={link.path}
              key={index}
              to={link.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                isActive({
                  matches,
                  path: link.path,
                  chatbotId,
                })
                  ? "bg-muted text-primary"
                  : "text-muted-foreground",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
