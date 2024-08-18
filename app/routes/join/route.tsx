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
import bcrypt from "bcryptjs";
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
import { useIsPending } from "~/hooks/use-is-pending";
import { getUserByEmail } from "~/models/user.server";
import { getUserId } from "~/session.server";
import { validateEmail } from "~/utils";
import {
  prepareVerification,
  verifySessionStorage,
} from "../verify/verify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const joinPasswordHashSessionKey = "joinPasswordHash";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  // const redirectTo = safeRedirect(formData.get("redirectTo"), "/chatbots");

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

  const passwordHash = await bcrypt.hash(password, 10);

  // OR - we can save this info in the verificationSessionCookie (so it is consistent with the rest of the verification types)
  // const unverifiedUser = await prisma.unverifiedUser.create({
  //   data: {
  //     email,
  //     passwordHash,
  //   },
  // });

  const verifySession = await verifySessionStorage.getSession();
  verifySession.set(joinPasswordHashSessionKey, passwordHash);

  // TODO - migrate to Paddle + don't need this here since the user hasnt been made officialy
  // await createCustomer({ userId: user.id });
  // const subscription = await prisma.subscription.findUnique({
  //   where: { userId: user.id },
  // });
  // if (!subscription) await createFreeSubscription({ userId: user.id });

  // logs the user in and redirects them to the dashboard (or the redirectTo page)
  // return createUserSession({
  //   redirectTo,
  //   remember: false,
  //   request,
  //   userId: user.id,
  // });

  // Prepare the verification
  const { verifyUrl, redirectTo, otp } = await prepareVerification({
    period: 10 * 60,
    request,
    type: "onboarding",
    target: email,
  });

  // send the verification email
  // const response = await sendEmail({
  //   to: email,
  //   subject: `Welcome to Epic Notes!`,
  //   react: <SignupEmail onboardingUrl={verifyUrl.toString()} otp={otp} />,
  // });

  console.log(
    `dummy email sent to ${email} with otp ${otp} and verifyUrl ${verifyUrl}`,
  );

  // return redirect(redirectTo.toString());

  return redirect(redirectTo.toString(), {
    headers: {
      "set-cookie": await verifySessionStorage.commitSession(verifySession),
    },
  });

  // if the email was sent successfully, redirect to the redirectTo page, otherwise return the email sending error
  // if (response.status === "success") {
  //   return redirect(redirectTo.toString());
  // } else {
  //   return json(
  //     {
  //       result: the error from the email sending
  //     },
  //     {
  //       status: 500,
  //     },
  //   );
  // }
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

            <Form action="/auth/google" method="post">
              <Button type="submit" className="w-full">
                Login with Google
              </Button>
            </Form>
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
