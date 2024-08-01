import { TabNav } from "@radix-ui/themes";
import { Link, Outlet, useMatches, useParams } from "@remix-run/react";
import { isActive } from "~/lib/utils";

export default function ChatbotChannelsWidget() {
  const matches = useMatches();
  const { chatbotId } = useParams();

  return (
    <div className="flex flex-col overflow-hidden h-full w-full items-start justify-start">
      <TabNav.Root className="m-4">
        <TabNav.Link
          asChild
          active={isActive({
            matches,
            path: `/chatbots/${chatbotId}/channels/widget/appearance`,
            chatbotId,
          })}
        >
          <Link to={`/chatbots/${chatbotId}/channels/widget/appearance`}>
            Appearance
          </Link>
        </TabNav.Link>
        <TabNav.Link
          asChild
          active={isActive({
            matches,
            path: `/chatbots/${chatbotId}/channels/widget/install`,
            chatbotId,
          })}
        >
          <Link to={`/chatbots/${chatbotId}/channels/widget/install`}>
            Installation
          </Link>
        </TabNav.Link>
      </TabNav.Root>
      <Outlet />
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/channels/widget`,
  breadcrumb: "widget",
};
