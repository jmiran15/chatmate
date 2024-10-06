import { motion } from "framer-motion";
import { Check, ChevronRight, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

import { SEOHandle } from "@nasa-gcn/remix-seo";
import { Subscription } from "@prisma/client";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
  SerializeFrom,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";
import {
  createCustomerPortal,
  createSubscriptionCheckout,
} from "~/models/subscription.server";
import { requireUserId } from "~/session.server";
import { getPricing } from "~/utils/pricing.server";
// import { pricing } from "../_header._index/landing_v2/pricing";

export const meta: MetaFunction = () => {
  return [{ title: "Chatmate - Billing" }];
};

export const ROUTE_PATH = "/chatbots/settings/billing" as const;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const pricing = getPricing();

  return json({ subscription, ...pricing });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  console.log("intent", intent);

  switch (intent) {
    case "createCheckout": {
      const priceId = String(formData.get("priceId"));
      const successUrl = String(formData.get("successUrl"));
      const cancelUrl = String(formData.get("cancelUrl"));

      console.log("successUrl", successUrl);
      console.log("cancelUrl", cancelUrl);

      const subscriptionData = {
        userId,
        priceId,
        ...(successUrl
          ? { successUrl }
          : {
              successUrl: "/chatbots",
            }),
        ...(cancelUrl
          ? { cancelUrl }
          : {
              cancelUrl: "/",
            }),
      };

      const checkoutUrl = await createSubscriptionCheckout(subscriptionData);

      console.log("checkoutUrl", checkoutUrl);
      if (!checkoutUrl) return json({ success: false } as const);
      return redirect(checkoutUrl);
    }
    case "createCustomerPortal": {
      const customerPortalUrl = await createCustomerPortal({
        userId,
      });
      if (!customerPortalUrl) return json({ success: false } as const);
      return redirect(customerPortalUrl);
    }
    default: {
      throw new Error("Invalid intent");
    }
  }
}

export default function BillingSettings() {
  const { subscription } = useLoaderData<typeof loader>();

  return (
    <div className="grid gap-6">
      <BillingManagement subscription={subscription} />
    </div>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

function BillingManagement({
  subscription,
}: {
  subscription: SerializeFrom<Subscription> | null;
}) {
  const { pricing } = useLoaderData<typeof loader>();
  const [isYearly, setIsYearly] = useState(subscription?.interval === "year");
  const manageSubscription = useFetcher({ key: "manageSubscription" });
  const upgradeSubscription = useFetcher({ key: "upgradeSubscription" });
  const isPendingManage =
    manageSubscription.state === "submitting" &&
    manageSubscription.formData &&
    manageSubscription.formData.get("intent") === "createCustomerPortal";

  const isPendingUpgrade =
    upgradeSubscription.state === "submitting" &&
    upgradeSubscription.formData &&
    upgradeSubscription.formData.get("intent") === "createCheckout";

  const handleUpgrade = (planId: string) => {
    // Implement Stripe checkout logic here
    console.log(`Upgrading to ${planId}`);

    // find the priceId for the planId
    const plan = pricing.find((p) => p.planId === planId);
    const priceId = isYearly ? plan?.yearlyPriceId : plan?.monthlyPriceId;
    if (!priceId) return;

    upgradeSubscription.submit(
      {
        intent: "createCheckout",
        priceId,
        successUrl: "/chatbots/settings/billing?success=true",
        cancelUrl: "/chatbots/settings/billing",
      },
      { method: "POST" },
    );
  };

  const handleManagePlan = () => {
    // Implement Stripe portal redirect logic here
    console.log("Redirecting to Stripe portal");
    manageSubscription.submit(
      { intent: "createCustomerPortal" },
      { method: "POST" },
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Billing Management</CardTitle>
        <CardDescription>
          Manage your subscription and billing details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {subscription ? (
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">
                Current Plan:{" "}
                {pricing.find((p) => p.planId === subscription.planId)?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isYearly ? "Yearly" : "Monthly"} billing •{" "}
                {subscription.cancelAtPeriodEnd === true ? (
                  <span className="text-red-500">Expires </span>
                ) : (
                  <span className="text-green-500">Next payment </span>
                )}
                on{" "}
                {new Date(
                  subscription.currentPeriodEnd * 1000,
                ).toLocaleDateString("en-US")}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleManagePlan}
              disabled={isPendingManage}
            >
              {isPendingManage ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Manage Plan"
              )}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">No Active Subscription</h3>
              <p className="text-sm text-muted-foreground">
                Choose a plan below to get started
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end items-center space-x-2">
          <Label htmlFor="billing-cycle">Monthly</Label>
          <Switch
            id="billing-cycle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-cycle">Yearly</Label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {pricing.map((plan) => {
            const isCurrentPlan = subscription?.planId === plan.planId;
            const actionText = isCurrentPlan
              ? "Current Plan"
              : subscription
              ? pricing.findIndex((p) => p.planId === plan.planId) <
                pricing.findIndex((p) => p.planId === subscription.planId)
                ? "Downgrade"
                : "Upgrade"
              : "Choose Plan";

            const priceId = isYearly ? plan.yearlyPriceId : plan.monthlyPriceId;
            const isPendingThis =
              isPendingUpgrade &&
              upgradeSubscription.formData &&
              upgradeSubscription.formData.get("priceId") === priceId;

            return (
              <motion.div
                key={plan.planId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`relative h-full ${
                    isCurrentPlan ? "border-primary" : ""
                  }`}
                >
                  {plan.isPopular && (
                    <Badge
                      className="absolute top-2 right-2"
                      variant="secondary"
                    >
                      Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">
                      {isYearly ? plan.yearlyPrice : plan.price}
                      <span className="text-sm font-normal">
                        /{isYearly ? "year" : "month"}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : "default"}
                      onClick={() => handleUpgrade(plan.planId)}
                      disabled={isCurrentPlan || isPendingThis}
                    >
                      {isPendingThis ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        actionText
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Secure payment with Stripe
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
