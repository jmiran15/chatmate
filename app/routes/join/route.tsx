import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";
import * as gtag from "~/utils/gtags.client";

import { SEOHandle } from "@nasa-gcn/remix-seo";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { prisma } from "~/db.server";
import { useIsPending } from "~/hooks/use-is-pending";
import {
  createCustomer,
  createFreeSubscription,
} from "~/models/subscription.server";
import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  const redirectTo = safeRedirect(formData.get("redirectTo"), "/chatbots");

  // TODO - do this stuff with Zod
  if (!validateEmail(email)) {
    return json(
      { errors: { email: "Email is invalid", password: null } },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      { errors: { email: null, password: "Password is required" } },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return json(
      { errors: { email: null, password: "Password is too short" } },
      { status: 400 },
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json(
      {
        errors: {
          email: "A user already exists with this email",
          password: null,
        },
      },
      { status: 400 },
    );
  }

  // TODO - since we are going to add email verification, set a flag to indicate not verified yet
  // or create in a new schema model - most likely the latter
  const user = await createUser(email, password);

  // TODO - migrate to Paddle
  await createCustomer({ userId: user.id });
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  if (!subscription) await createFreeSubscription({ userId: user.id });

  // logs the user in and redirects them to the dashboard (or the redirectTo page)
  return createUserSession({
    redirectTo,
    remember: false,
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Sign Up" }];

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const isPending = useIsPending({ intent: "signUp" });

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  const handleSubmit = () => {
    gtag.event({
      action: "sign_up",
    });
  };

  return (
    <div className="flex justify-center items-center h-screen p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit} method="post" className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
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
              />

              {actionData?.errors?.email ? (
                <p
                  className="pt-1 text-red-700 text-sm font-medium leading-none"
                  id="email-error"
                >
                  {actionData.errors.email}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordRef}
                name="password"
                autoComplete="current-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                id="password"
                type="password"
                required
              />
              {actionData?.errors?.password ? (
                <p
                  className="pt-1 text-red-700 text-sm font-medium leading-none"
                  id="password-error"
                >
                  {actionData.errors.password}
                </p>
              ) : null}
            </div>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input type="hidden" name="intent" value="signUp" />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create an account"
              )}
            </Button>

            <Button variant="outline" className="w-full">
              {/* TODO - add Google SSO logo */}
              Sign up with Google
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="underline">
                Sign in
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};
