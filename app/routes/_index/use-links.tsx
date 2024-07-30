import { useFetchers, useMatches, useParams } from "@remix-run/react";
import {
  TestTube,
  Database,
  Brush,
  Share,
  Settings,
  MessagesSquare,
  AreaChart,
  LucideIcon,
} from "lucide-react";
import { useOptionalUser } from "~/utils";

export interface RouteLink {
  title: string;
  path: string;
  icon?: LucideIcon;
  navigate?: boolean;
  badge?: number | null;
}

export const useLinks = () => {
  const { chatbotId } = useParams();
  const user = useOptionalUser();
  const matches = useMatches();
  const chatbotIdRoute = matches.find(
    (match) => match.id === "routes/chatbots.$chatbotId",
  ) as { data: { unseenChats: number } } | undefined;

  const fetchers = useFetchers();
  const readFetchers = fetchers.filter((fetcher) =>
    fetcher.key.startsWith(`mark-seen-`),
  );

  const unseenChats = chatbotIdRoute?.data?.unseenChats
    ? chatbotIdRoute?.data?.unseenChats - readFetchers.length
    : null;

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

  const routes: RouteLink[] =
    user && chatbotId ? chatbotSidebarLinks : unauthenticatedLinks;

  return {
    routes,
  };
};
