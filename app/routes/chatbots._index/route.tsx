import { SEOHandle } from "@nasa-gcn/remix-seo";
import { Prisma } from "@prisma/client";
import {
  LoaderFunctionArgs,
  MetaFunction,
  SerializeFrom,
  json,
} from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { prisma } from "~/db.server";
import { useIsPending } from "~/hooks/use-is-pending";
// import { INTERVALS, PLANS } from "~/routes/_header._index/pricing-page";
import ChatbotCard from "~/routes/chatbots._index/chatbot-card";
import { requireUserId } from "~/session.server";
// import { pricing } from "../_header._index/landing_v2/pricing";
import { getPricing } from "~/utils/pricing.server";
import Container from "../chatbots.$chatbotId.forms._index/Container";
import Description from "../chatbots.$chatbotId.forms._index/Description";
import Title from "../chatbots.$chatbotId.forms._index/Title";

// TODO: here we simply need to check for the different tiers for deciding the number of chatbots a user can create. Just get the subscription in the loader
export const meta: MetaFunction = () => [{ title: "Chatbots" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const pricing = getPricing();

  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });

  const planId = subscription?.planId;

  const pricingPlan = pricing.pricing.find((plan) => plan.planId === planId);
  const chatbotsLimit = pricingPlan?.chatbotsLimit ?? 0;

  // next plan in line (i.e. the upgrade if any)
  const idx = pricing.pricing.findIndex((plan) => plan.planId === planId);
  const nextPlan =
    idx !== -1 || idx !== pricing.pricing.length - 1
      ? pricing.pricing[idx + 1]
      : null;

  console.log("Chatbot limit: ", chatbotsLimit);

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

  return json({ chatbots, chatbotsLimit, nextPlan });
};

export default function MyChatbots() {
  const data = useLoaderData<typeof loader>();
  const isPending = useIsPending({
    intent: "createCheckout",
  });

  return (
    <Container className="max-w-3xl">
      <Header
        chatbotsLimit={data.chatbotsLimit || 0}
        chatbots={data.chatbots}
        isPending={isPending}
        nextPlan={
          data.nextPlan ? { priceId: data.nextPlan.monthlyPriceId } : null
        }
      />
      <Separator />
      {data.chatbots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chatbots yet</p>
      ) : (
        <div className="flex flex-col gap-4 overflow-y-auto flex-1 w-full">
          {data.chatbots.map((chatbot) => (
            <ChatbotCard key={chatbot.id} chatbot={chatbot} />
          ))}
        </div>
      )}
    </Container>
  );
}

function Header({
  chatbotsLimit,
  chatbots,
  isPending,
  nextPlan,
}: {
  chatbotsLimit: number;
  chatbots: SerializeFrom<
    Prisma.ChatbotGetPayload<{
      select: {
        id: true;
        name: true;
        createdAt: true;
      };
    }>[]
  >;
  isPending: boolean;
  nextPlan: {
    priceId: string;
  } | null;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between">
      <div className="flex flex-col">
        <Title>Chatbots</Title>
        <Description>Manage your chatbots</Description>
      </div>
      <div className="flex flex-row gap-2 items-center">
        <Button
          // asChild
          // type="submit"
          disabled={chatbots.length >= chatbotsLimit ? true : false}
        >
          <Link to="/chatbots/new" className="flex items-center gap-1">
            <Plus className="mr-2 h-4 w-4" />{" "}
            <span className="text-md">New Chatbot</span>
          </Link>
        </Button>

        {chatbots.length >= chatbotsLimit && nextPlan ? (
          <Form method="post" action="/chatbots/settings/billing">
            <input type="hidden" name="priceId" value={nextPlan.priceId} />
            <input
              type="hidden"
              name="successUrl"
              value="/chatbots?success=true"
            />
            <input type="hidden" name="cancelUrl" value="/" />
            <Button
              type="submit"
              name="intent"
              value="createCheckout"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <span className="text-md">Upgrade to Pro</span>
              )}
            </Button>
          </Form>
        ) : null}
      </div>
    </div>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};
