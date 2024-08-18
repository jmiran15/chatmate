import {
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function ChangeEmail() {
  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData();
  const loaderData = useLoaderData();
  const submit = useSubmit();

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Card x-chunk="dashboard-04-chunk-1">
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
