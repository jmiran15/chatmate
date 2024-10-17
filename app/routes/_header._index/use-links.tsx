import { useFetchers, useMatches, useParams } from "@remix-run/react";
import {
  AreaChart,
  BookPlus,
  Database,
  Inbox,
  Lightbulb,
  LucideIcon,
  Paintbrush,
  Settings,
  Share,
  TestTube,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";
import { useOptionalUser } from "~/utils";

export interface RouteLink {
  title: string;
  path: string;
  icon?: LucideIcon;
  navigate?: boolean;
  badge?: number | null;
  children?: RouteLink[];
}

export const useLinks = () => {
  const { chatbotId } = useParams();
  const user = useOptionalUser();
  const matches = useMatches();
  const chatbotIdRoute = matches.find(
    (match) => match.id === "routes/chatbots.$chatbotId",
  ) as { data: { unseenChats: number } } | undefined;

  const fetchers = useFetchers();
  const readFetchers = fetchers.filter(
    (fetcher) =>
      fetcher.key.startsWith(`mark-seen-`) &&
      fetcher.formData &&
      fetcher.formData.get("intent") === "mark-seen",
  );

  const unseenChats = chatbotIdRoute?.data?.unseenChats
    ? chatbotIdRoute?.data?.unseenChats - readFetchers.length
    : null;

  const chatbotSidebarLinks = [
    {
      title: "Inbox",
      path: `/chatbots/${chatbotId}/chats`,
      icon: Inbox,
      navigate: true,
      badge: unseenChats,
    },
    {
      title: "Flows",
      path: `/chatbots/${chatbotId}/flows`,
      icon: Workflow,
      navigate: true,
    },
    {
      title: "Forms",
      path: `/chatbots/${chatbotId}/forms`,
      icon: BookPlus,
      navigate: true,
    },
    // {
    //   title: "Actions",
    //   path: `/chatbots/${chatbotId}/actions`,
    //   icon: Flame,
    //   navigate: true,
    // },
    {
      title: "Data",
      path: `/chatbots/${chatbotId}/data`,
      icon: Database,
      navigate: true,
    },
    {
      title: "Suggestions",
      path: `/chatbots/${chatbotId}/suggestions`,
      icon: Lightbulb,
      navigate: true,
    },
    {
      title: "Appearance",
      path: `/chatbots/${chatbotId}/appearance`,
      navigate: true,
      icon: Paintbrush,
    },
    {
      title: "Installation",
      path: `/chatbots/${chatbotId}/install`,
      navigate: true,
      icon: Share,
    },
    // {
    //   title: "Channels",
    //   path: `/chatbots/${chatbotId}/channels`,
    //   icon: Megaphone,
    //   navigate: true,
    //   children: [
    //     {
    //       title: "Widget",
    //       path: `/chatbots/${chatbotId}/channels/widget/appearance`,
    //       navigate: true,
    //     },
    // {
    //   title: "Email",
    //   path: `/chatbots/${chatbotId}/channels/email`,
    //   navigate: true,
    // },
    // {
    //   title: "Phone",
    //   path: `/chatbots/${chatbotId}/channels/phone`,
    //   navigate: true,
    // },
    // {
    //   title: "WhatsApp",
    //   path: `/chatbots/${chatbotId}/channels/whatsapp`,
    //   navigate: true,
    // },
    // ],
    // },
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
    {
      path: "/blog",
      title: "Blog",
      navigate: true,
    },
  ];

  return useMemo(() => {
    const routes: RouteLink[] =
      user && chatbotId ? chatbotSidebarLinks : unauthenticatedLinks;

    return { routes };
  }, [user, chatbotId, unseenChats]);
};
