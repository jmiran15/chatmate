import { Form } from "@remix-run/react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function ManageSubscription() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subscription</CardTitle>
        <CardDescription>
          Update your payment method, billing address, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-normal text-primary/60">
          You will be redirected to the Stripe Customer Portal.
        </p>
      </CardContent>
      <CardFooter>
        <Form method="POST">
          <Button
            type="submit"
            size="sm"
            name="intent"
            value="createCustomerPortal"
          >
            Manage
          </Button>
        </Form>
      </CardFooter>
    </Card>
  );
}
