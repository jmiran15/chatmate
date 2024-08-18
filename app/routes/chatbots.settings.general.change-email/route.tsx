import { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useRef } from "react";
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

export const action = async ({ request }: ActionFunctionArgs) => {};

export default function ChangeEmail() {
  const loaderData = useLoaderData();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const actionData = useActionData();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Change Email</CardTitle>
        <CardDescription>
          You will receive an email at the new email address to confirm. An
          email notice will also be sent to your old address{" "}
          <span className="font-semibold">{`some email`}</span>
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
      <CardFooter>
        <Button type="submit">Send Confirmation Email</Button>
      </CardFooter>
    </Card>
  );
}
