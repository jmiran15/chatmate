import { Subscription } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useIsPending } from "~/hooks/use-is-pending";
import { Badge } from "../../components/ui/badge";
import { plans } from "../_header._index/pricing-page";

export default function ChangePlan({
  subscription,
}: {
  subscription: SerializeFrom<Subscription>;
}) {
  const [selectedPriceId, setSelectedPriceId] = useState<string>(
    subscription.priceId,
  );

  const isPending = useIsPending({
    intent: "createCheckout",
  });

  console.log({ subscription });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan</CardTitle>
        <CardDescription>
          <p className="flex items-start gap-1 text-sm font-normal text-primary/60">
            You are currently on the{" "}
            <Badge variant="secondary">
              {subscription
                ? subscription.planId?.charAt(0).toUpperCase() +
                  subscription.planId.slice(1)
                : "Free"}
            </Badge>
            plan.{" "}
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Plans */}
        {/* show the pricing plans if they are on the free tier */}
        <div className="flex w-full flex-col items-center justify-evenly gap-2 border-border p-6 pt-0">
          {plans.map((plan) => (
            <div
              key={plan.price_id}
              tabIndex={0}
              role="button"
              className={`flex w-full select-none items-center rounded-md border border-border hover:border-primary/60 ${
                selectedPriceId === plan.price_id && "border-primary/60"
              }`}
              onClick={() => setSelectedPriceId(plan.price_id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelectedPriceId(plan.price_id);
              }}
            >
              <div className="flex w-full flex-col items-start p-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-primary">
                    {plan.name}
                  </span>

                  <span className="flex items-center rounded-md bg-primary/10 px-1.5 text-sm font-medium text-primary/80">
                    {plan.interval}
                  </span>
                </div>
                <p className="text-start text-sm font-normal text-primary/60">
                  {/* {plan.description} */}
                  {"Features..."}
                </p>
              </div>

              {/* Billing Switch */}
            </div>
          ))}
        </div>

        {/* the user is on paid subscription - so show them their info */}
        <div className="flex w-full items-center overflow-hidden rounded-md border border-primary/60">
          <div className="flex w-full flex-col items-start p-4">
            <div className="flex items-end gap-2">
              <span className="text-base font-medium text-primary">
                {subscription.planId.charAt(0).toUpperCase() +
                  subscription.planId.slice(1)}
              </span>
              <p className="flex items-start gap-1 text-sm font-normal text-primary/60">
                {subscription.cancelAtPeriodEnd === true ? (
                  <span className="flex h-[18px] items-center text-sm font-medium text-red-500">
                    Expires
                  </span>
                ) : (
                  <span className="flex h-[18px] items-center text-sm font-medium text-green-500">
                    Renews
                  </span>
                )}
                on:{" "}
                {new Date(
                  subscription.currentPeriodEnd * 1000,
                ).toLocaleDateString("en-US")}
                .
              </p>
            </div>
            <p className="text-start text-sm font-normal text-primary/60">
              {/* {PRICING_PLANS[PLANS.PRO].description} */}
              {"Features..."}
            </p>
          </div>
        </div>
      </CardContent>
      {/* the user is on free tier, so show them the plan upgrade options */}

      <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
        <Form method="POST">
          <input type="hidden" name="priceId" value={selectedPriceId} />
          <input type="hidden" name="interval" value={selectedPriceId} />
          <Button
            type="submit"
            size="sm"
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
      </CardFooter>
    </Card>
  );
}
