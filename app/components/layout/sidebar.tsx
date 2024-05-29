import { Link, useMatches } from "@remix-run/react";
import {
  AreaChart,
  Brush,
  Database,
  MessageSquareMore,
  MessagesSquare,
  Settings,
  Share,
} from "lucide-react";
import { cn } from "~/lib/utils";

export default function Sidebar() {
  const matches = useMatches();
  const links = [
    {
      title: "Chats",
      path: "chats",
      icon: MessagesSquare,
    },
    {
      title: "Data",
      path: "data",
      icon: Database,
    },
    {
      title: "Appearance",
      path: "appearance",
      icon: Brush,
    },
    {
      title: "Share",
      path: "share",
      icon: Share,
    },
    {
      title: "Analytics",
      path: "analytics",
      icon: AreaChart,
    },
    {
      title: "Chat",
      path: "chat",
      icon: MessageSquareMore,
    },
    {
      title: "Settings",
      path: "settings",
      icon: Settings,
    },
  ];

  function isActive(path: string) {
    return matches.filter((match) =>
      match.handle ? match.handle.breadcrumb === path : false,
    ).length;
  }

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
                isActive(link.path)
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
