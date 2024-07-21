import { buttonVariants } from "../ui/button";
import { Link, useLocation, useMatches, useParams } from "@remix-run/react";
import { Icons } from "../icons";
import { useOptionalUser } from "~/utils";

import {
  TestTube,
  Database,
  Brush,
  Share,
  Settings,
  MessagesSquare,
  AreaChart,
} from "lucide-react";
import SidebarSheet from "./sidebar-sheet";
import ProfileDropdown from "./profile-dropdown";
import { useMobileScreen } from "~/utils/mobile";
import MarketingLinks from "./marketing-links";
import { cn } from "~/lib/utils";
import { useEffect } from "react";

export const Header = () => {
  const user = useOptionalUser();
  const { chatbotId } = useParams();
  const sheet = (user && chatbotId) || !user;
  const isMobile = useMobileScreen();
  const location = useLocation();
  const matches = useMatches();
  const chatbotIdRoute = matches.find(
    (match) => match.id === "routes/chatbots.$chatbotId",
  );

  const unseenChats = chatbotIdRoute?.data?.unseenChats || 0;

  const chatbotSidebarLinks = [
    {
      title: "Chats",
      path: `/chatbots/${chatbotId}/chats`,
      icon: MessagesSquare,
      navigate: true,
      badge: unseenChats,
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
      title: "Test chatbot",
      path: `/chatbots/${chatbotId}/chat`,
      icon: TestTube,
      navigate: true,
    },
    {
      title: "Settings",
      path: `/chatbots/${chatbotId}/settings`,
      icon: Settings,
      navigate: true,
    },
  ];

  const unauthenticatedLinks = [
    {
      path: "/#features",
      title: "Features",
      navigate: false,
    },

    {
      path: "/#pricing",
      title: "Pricing",
      navigate: false,
    },

    {
      path: "/#faq",
      title: "FAQ",
      navigate: false,
    },
  ];

  const routes = user && chatbotId ? chatbotSidebarLinks : unauthenticatedLinks;

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.hash]);

  return (
    <header className="sticky h-14 border-b bg-muted/40">
      <div
        className={cn(
          "flex items-center justify-between mx-auto gap-4 h-full px-4",
          chatbotId ? "w-full" : "max-w-6xl",
        )}
      >
        <div className="flex items-center gap-8">
          {sheet ? <SidebarSheet routes={routes} matches={matches} /> : null}
          {!isMobile || user ? (
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Icons.logo className="h-6 w-6" />
              <span>Chatmate</span>
            </Link>
          ) : null}
          {!user || !chatbotId ? <MarketingLinks routes={routes} /> : null}
        </div>

        {user ? (
          <ProfileDropdown />
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className={buttonVariants({ variant: "outline" })}
            >
              Log In
            </Link>

            <Link to="/join" className={buttonVariants()}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
