import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Loader2 } from "lucide-react";
import ChatbotCard from "~/routes/chatbots._index/chatbot-card";
import { INTERVALS, PLANS } from "~/routes/_header._index/pricing-page";
import { Button } from "~/components/ui/button";
import { useIsPending } from "~/hooks/use-is-pending";
import { isProUser } from "~/models/user.server";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export const meta: MetaFunction = () => [{ title: "Chatbots" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const isPro = await isProUser(userId);

  // TODO - defer this + select only the fields we need + add an index by userId?
  const chatbots = await prisma.chatbot.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ chatbots, isPro });
};

export default function MyChatbots() {
  const data = useLoaderData<typeof loader>();
  const isPending = useIsPending({
    intent: "createCheckout",
  });

  return (
    <div className="flex flex-col gap-8 w-full py-12 px-8 md:px-20 xl:px-96">
      <div className="flex flex-col items-start gap-2 lg:flex-row lg:justify-between lg:items-center ">
        <h1 className="text-2xl font-bold leading-tight tracking-tighter">
          Chatbots
        </h1>
        <div className="flex flex-row gap-2 items-center">
          <Form method="get" action="/chatbots/new" navigate>
            <Button
              type="submit"
              disabled={!data.isPro && data.chatbots.length >= 1 ? true : false}
            >
              + New Chatbot
            </Button>
          </Form>
          {!data.isPro && data.chatbots.length >= 1 ? (
            <Form method="post" action="/chatbots/settings/billing">
              <input type="hidden" name="planId" value={PLANS.PRO} />
              <input
                type="hidden"
                name="planInterval"
                value={INTERVALS.MONTH}
              />
              <Button
                type="submit"
                name="intent"
                value="createCheckout"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Upgrade to Pro"
                )}
              </Button>
            </Form>
          ) : null}
        </div>
      </div>

      {data.chatbots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chatbots yet</p>
      ) : (
        <ol className="space-y-4">
          {data.chatbots.map((chatbot) => (
            <li key={chatbot.id}>
              <ChatbotCard chatbot={chatbot} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
