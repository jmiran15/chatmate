import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { SEOHandle } from "@nasa-gcn/remix-seo";
import bcrypt from "bcryptjs";
import SignupEmail from "emails/sign-up";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { SpamError } from "remix-utils/honeypot/server";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ErrorList } from "~/components/ui/error-list";
import { Field } from "~/components/ui/field";
import { StatusButton } from "~/components/ui/status-button";
import { useIsPending } from "~/hooks/use-is-pending";
import { getUserByEmail } from "~/models/user.server";
import { requireAnonymous } from "~/session.server";
import { sendEmail } from "~/utils/email.server";
import { honeypot } from "~/utils/honeypot.server";
import { getPricing } from "~/utils/pricing.server";
import { EmailSchema, PasswordSchema } from "~/utils/types";
import {
  prepareVerification,
  verifySessionStorage,
} from "../_auth.verify/verify.server";
// import { priceIds } from "../_header._index/landing_v2/pricing";

export const joinPasswordHashSessionKey = "joinPasswordHash";
export const priceIdSessionKey = "priceId";
const SignupSchema = z.object({
  intent: z.string().optional(),
  email: EmailSchema,
  password: PasswordSchema,
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAnonymous(request);
  const url = new URL(request.url);
  const priceId = url.searchParams.get("priceId");
  const pricing = getPricing();
  return json({ priceId, ...pricing });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  try {
    honeypot.check(formData);
  } catch (error) {
    if (error instanceof SpamError) {
      throw new Response("Form not submitted properly", { status: 400 });
    }
    throw error;
  }

  // get the search params
  const url = new URL(request.url);
  const priceId = url.searchParams.get("priceId");

  console.log("priceId", priceId);
  const pricing = getPricing();

  const submission = await parseWithZod(formData, {
    schema: SignupSchema.superRefine(async (data, ctx) => {
      const existingUser = await getUserByEmail(data.email);

      if (existingUser) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this email",
        });
        return;
      }
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return json(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 },
    );
  }

  const { email, password } = submission.value;
  const passwordHash = await bcrypt.hash(password, 10);

  const verifySession = await verifySessionStorage.getSession();
  verifySession.set(joinPasswordHashSessionKey, passwordHash);
  verifySession.set(
    priceIdSessionKey,
    priceId || pricing.isDev
      ? pricing.devPriceIds.hobby.month
      : pricing.prodPriceIds.hobby.month,
  );

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

  if (response.status === "success") {
    return redirect(redirectTo.toString(), {
      headers: {
        "set-cookie": await verifySessionStorage.commitSession(verifySession),
      },
    });
  } else {
    return json(
      {
        result: submission.reply({ formErrors: [response.error.message] }),
      },

      {
        status: 500,
      },
    );
  }
};

export const meta: MetaFunction = () => [{ title: "Sign Up for Chatmate" }];

export default function Join() {
  const data = useLoaderData<typeof loader>();

  const PRIVACY_POLICY_URL = "https://chatmate.so/policies/privacy";
  const TERMS_OF_SERVICE_URL = "https://chatmate.so/policies/terms";
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending({ intent: "signUp" });
  const googleFetcher = useFetcher();

  const handleGoogleSignUp = () => {
    // Remove existing priceId from localStorage
    localStorage.removeItem("priceId");
    // Set new priceId in localStorage
    localStorage.setItem(
      "priceId",
      data.priceId ??
        (data.isDev
          ? data.devPriceIds.unlimited.month
          : data.prodPriceIds.unlimited.month),
    );

    googleFetcher.submit({}, { method: "post", action: "/auth/google" });
  };

  const [form, fields] = useForm({
    id: "signup-form",
    constraint: getZodConstraint(SignupSchema),
    defaultValue: {
      intent: "signUp",
    },
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: SignupSchema });
      return result;
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <Card className="w-full max-w-[90%] sm:max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          method="POST"
          {...getFormProps(form)}
          className="flex flex-col gap-4 sm:gap-6"
        >
          <HoneypotInputs label="Please leave this field blank" />
          <Field
            labelProps={{
              htmlFor: fields.email.id,
              children: "Email",
            }}
            inputProps={{
              ...getInputProps(fields.email, { type: "email" }),
              autoFocus: true,
              autoComplete: "email",
              className: "lowercase",
            }}
            errors={fields.email.errors}
          />

          <Field
            labelProps={{ children: "Password" }}
            inputProps={{
              ...getInputProps(fields.password, {
                type: "password",
              }),
              autoComplete: "new-password",
            }}
            errors={fields.password.errors}
          />

          <input {...getInputProps(fields.intent, { type: "hidden" })} />
          <ErrorList errors={form.errors} id={form.errorId} />

          <div className="flex flex-col gap-2 sm:gap-4">
            <StatusButton
              className="w-full"
              status={isPending ? "pending" : form.status ?? "idle"}
              type="submit"
              disabled={isPending}
            >
              Create an account
            </StatusButton>

            <Button
              type="button"
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={googleFetcher.state === "submitting"}
            >
              <GoogleIcon className="w-5 h-5" />
              <span>Sign up with Google</span>
            </Button>
          </div>
          <div className="text-center text-sm">
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
