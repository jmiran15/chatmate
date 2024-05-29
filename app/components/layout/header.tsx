import { buttonVariants } from "../ui/button";
import { Link, useParams } from "@remix-run/react";
import { Icons } from "../icons";
import { useOptionalUser } from "~/utils";

import {
  MessageSquareMore,
  Database,
  Brush,
  Share,
  Settings,
  MessagesSquare,
  AreaChart,
} from "lucide-react";
import SidebarSheet from "./sidebar-sheet";
import ProfileDropdown from "./profile-dropdown";

export const Header = () => {
  const user = useOptionalUser();
  const { chatbotId } = useParams();
  const sheet = (user && chatbotId) || !user;

  const chatbotSidebarLinks = [
    {
      title: "Chat",
      path: `/chatbots/${chatbotId}/chat`,
      icon: MessageSquareMore,
    },
    {
      title: "Data",
      path: `/chatbots/${chatbotId}/data`,
      icon: Database,
    },
    {
      title: "Appearance",
      path: `/chatbots/${chatbotId}/appearance`,
      icon: Brush,
    },
    {
      title: "Share",
      path: `/chatbots/${chatbotId}/share`,
      icon: Share,
    },
    {
      title: "Chats",
      path: `/chatbots/${chatbotId}/chats`,
      icon: MessagesSquare,
    },
    {
      title: "Analytics",
      path: `/chatbots/${chatbotId}/analytics`,
      icon: AreaChart,
    },
    {
      title: "Settings",
      path: `/chatbots/${chatbotId}/settings`,
      icon: Settings,
    },
  ];

  const unauthenticatedLinks = [
    {
      path: "#features",
      title: "Features",
    },

    {
      path: "#pricing",
      title: "Pricing",
    },

    {
      path: "#faq",
      title: "FAQ",
    },
  ];

  const routes = user && chatbotId ? chatbotSidebarLinks : unauthenticatedLinks;

  return (
    <header className="sticky flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Link to="/" className="hidden lg:flex items-center gap-2 font-semibold">
        <Icons.logo className="h-6 w-6" />
        <span className="">Chatmate</span>
      </Link>

      {sheet ? <SidebarSheet routes={routes} /> : null}

      {user ? (
        <ProfileDropdown />
      ) : (
        <div className="flex items-center gap-2">
          <Link to="/login" className={buttonVariants({ variant: "outline" })}>
            Log In
          </Link>

          <Link to="/join" className={buttonVariants()}>
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
};
