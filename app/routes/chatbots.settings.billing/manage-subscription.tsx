import { Form } from "@remix-run/react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useIsPending } from "~/hooks/use-is-pending";
import { Loader2 } from "lucide-react";

export default function ManageSubscription() {
  const isPending = useIsPending({
    intent: "createCustomerPortal",
  });
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
            disabled={isPending}
          >
            {isPending ? <Loader2 className="animate-spin" /> : "Manage"}
          </Button>
        </Form>
      </CardFooter>
    </Card>
  );
}
