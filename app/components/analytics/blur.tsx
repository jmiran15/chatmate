import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";
import { INTERVALS, PLANS } from "../pricing-page";

export default function Blur() {
  return (
    <Card className="w-full h-full items-center justify-center flex flex-col">
      <div className="flex flex-col items-start justify-center gap-4">
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>
          Unlock all features and get unlimited access to our support team.
        </CardDescription>
        <Form method="post" action="/chatbots/settings/billing">
          <input type="hidden" name="planId" value={PLANS.PRO} />
          <input type="hidden" name="planInterval" value={INTERVALS.MONTH} />
          <Button type="submit" name="intent" value="createCheckout">
            Upgrade
          </Button>
        </Form>
      </div>
    </Card>
  );
}
