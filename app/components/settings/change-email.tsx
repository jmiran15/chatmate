import {
  Form,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";

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
        <CardTitle>Email</CardTitle>
        <CardDescription>
          This is the email that will be used to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="post" ref={formRef} className="grid gap-2">
          <input type="hidden" name="intent" value="changeEmail" />
          <Input
            ref={emailRef}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={true}
            name="email"
            autoComplete="email"
            aria-invalid={actionData?.errors?.email ? true : undefined}
            aria-describedby="email-error"
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            defaultValue={loaderData?.user.email}
          />

          {actionData?.errors?.email ? (
            <p
              className="pt-1 text-red-700 text-sm font-medium leading-none"
              id="email-error"
            >
              {actionData.errors.email}
            </p>
          ) : null}
        </Form>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={() => submit(formRef.current)}>Save</Button>
      </CardFooter>
    </Card>
  );
}
