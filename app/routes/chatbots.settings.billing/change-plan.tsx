import { Form, useLoaderData } from "@remix-run/react";
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
import {
  CURRENCIES,
  INTERVALS,
  Interval,
  PLANS,
  PRICING_PLANS,
  Plan,
} from "../_index/pricing-page";
import { Switch } from "../../components/ui/switch";
import { loader } from "~/routes/chatbots.settings.billing/route";
import { Badge } from "../../components/ui/badge";
import { Loader2 } from "lucide-react";
import { useIsPending } from "~/hooks/use-is-pending";

export default function ChangePlan() {
  const { subscription, currency } = useLoaderData<typeof loader>();

  const [selectedPlanId, setSelectedPlanId] = useState<Plan>(
    (subscription?.planId as Plan) ?? PLANS.FREE,
  );
  const [selectedPlanInterval, setSelectedPlanInterval] = useState<Interval>(
    INTERVALS.MONTH,
  );
  const isPending = useIsPending({
    intent: "createCheckout",
  });

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
        {subscription?.planId === PLANS.FREE ? (
          <div className="flex w-full flex-col items-center justify-evenly gap-2 border-border p-6 pt-0">
            {Object.values(PRICING_PLANS).map((plan) => (
              <div
                key={plan.id}
                tabIndex={0}
                role="button"
                className={`flex w-full select-none items-center rounded-md border border-border hover:border-primary/60 ${
                  selectedPlanId === plan.id && "border-primary/60"
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedPlanId(plan.id);
                }}
              >
                <div className="flex w-full flex-col items-start p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-primary">
                      {plan.name}
                    </span>
                    {plan.id !== PLANS.FREE ? (
                      <span className="flex items-center rounded-md bg-primary/10 px-1.5 text-sm font-medium text-primary/80">
                        {currency === CURRENCIES.USD ? "$" : "€"}{" "}
                        {selectedPlanInterval === INTERVALS.MONTH
                          ? plan.prices[INTERVALS.MONTH][currency] / 100
                          : plan.prices[INTERVALS.YEAR][currency] / 100}{" "}
                        /{" "}
                        {selectedPlanInterval === INTERVALS.MONTH
                          ? "month"
                          : "year"}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-start text-sm font-normal text-primary/60">
                    {plan.description}
                  </p>
                </div>

                {/* Billing Switch */}
                {plan.id !== PLANS.FREE ? (
                  <div className="flex items-center gap-2 px-4">
                    <label
                      htmlFor="interval-switch"
                      className="text-start text-sm text-primary/60"
                    >
                      {selectedPlanInterval === INTERVALS.MONTH
                        ? "Monthly"
                        : "Yearly"}
                    </label>
                    <Switch
                      id="interval-switch"
                      checked={selectedPlanInterval === INTERVALS.YEAR}
                      onCheckedChange={() =>
                        setSelectedPlanInterval((prev) =>
                          prev === INTERVALS.MONTH
                            ? INTERVALS.YEAR
                            : INTERVALS.MONTH,
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {/* the user is on paid subscription - so show them their info */}
        {subscription && subscription.planId !== PLANS.FREE ? (
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
                {PRICING_PLANS[PLANS.PRO].description}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
      {/* the user is on free tier, so show them the plan upgrade options */}
      {subscription?.planId === PLANS.FREE ? (
        <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
          <Form method="POST">
            <input type="hidden" name="planId" value={selectedPlanId} />
            <input
              type="hidden"
              name="planInterval"
              value={selectedPlanInterval}
            />
            <Button
              type="submit"
              size="sm"
              name="intent"
              value="createCheckout"
              disabled={selectedPlanId === PLANS.FREE || isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Upgrade to Pro"
              )}
            </Button>
          </Form>
        </CardFooter>
      ) : null}
    </Card>
  );
}
