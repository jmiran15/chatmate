import type { Prisma } from "@prisma/client";
import type { SerializeFrom } from "@remix-run/node";
import { formatDistanceToNow } from "date-fns";

import { LinkCard } from "~/components/LinkCard";
import { LinkCardBody } from "~/components/LinkCardBody";
import { LinkCardHeader } from "~/components/LinkCardHeader";

export default function ChatbotCard({
  chatbot,
}: {
  chatbot: SerializeFrom<
    Prisma.ChatbotGetPayload<{
      select: {
        id: true;
        name: true;
        createdAt: true;
      };
    }>
  >;
}) {
  return (
    <LinkCard to={`${chatbot.id}/chats`}>
      <div className="p-4 flex flex-col gap-1">
        <LinkCardHeader title={chatbot.name} tag={undefined} />
        <LinkCardBody>
          <span>
            {formatDistanceToNow(new Date(chatbot.createdAt), {
              addSuffix: true,
            })}
          </span>
        </LinkCardBody>
      </div>
    </LinkCard>
  );
}
