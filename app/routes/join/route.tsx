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
import { sendEmail } from "~/utils/email.server";
import {
  prepareVerification,
  verifySessionStorage,
} from "../verify/verify.server";
import { SignupEmail } from "./email";

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
  const response = await sendEmail({
    to: email,
    subject: `Welcome to Chatmate!`,
    react: <SignupEmail onboardingUrl={verifyUrl.toString()} otp={otp} />,
  });

  // console.log(
  //   `dummy email sent to ${email} with otp ${otp} and verifyUrl ${verifyUrl}`,
  // );

  // return redirect(redirectTo.toString());

  // if the email was sent successfully, redirect to the redirectTo page, otherwise return the email sending error
  if (response.status === "success") {
    return redirect(redirectTo.toString(), {
      headers: {
        "set-cookie": await verifySessionStorage.commitSession(verifySession),
      },
    });
  } else {
    return json(
      {
        // result: submission.reply({ formErrors: [response.error.message] }),
        result: response.error.message,
      },

      {
        status: 500,
      },
    );
  }
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

  const PRIVACY_POLICY_URL =
    "https://app.termly.io/policy-viewer/policy.html?policyUUID=064c1b30-2950-4e38-9908-700473644f6c";

  const TERMS_OF_SERVICE_URL =
    "https://app.termly.io/policy-viewer/policy.html?policyUUID=6201437d-0e7b-4223-a7b8-72c15211f9ac";

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
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>Sign up with Google</span>
              </Button>
            </Form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="underline">
                Sign in
              </Link>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link
                to={TERMS_OF_SERVICE_URL}
                className="underline hover:text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to={PRIVACY_POLICY_URL}
                className="underline hover:text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
