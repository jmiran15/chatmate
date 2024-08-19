import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { loader } from "./route";

export default function AccountDetails() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account details</CardTitle>
        <CardDescription>Change your account details here.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 items-start justify-start">
        <Button variant="secondary" asChild>
          <Link to="/chatbots/settings/general/change-email">
            Change email from {loaderData?.user.email}
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/chatbots/settings/general/change-password">
            Change password
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
