import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";

import { verifyLogin } from "~/models/user.server";
import { createUserSession, requireAnonymous } from "~/session.server";
import { safeRedirect } from "~/utils";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { SEOHandle } from "@nasa-gcn/remix-seo";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CheckboxField } from "~/components/ui/checkbox-field";
import { ErrorList } from "~/components/ui/error-list";
import { Field } from "~/components/ui/field";
import { Label } from "~/components/ui/label";
import { StatusButton } from "~/components/ui/status-button";
import { useIsPending } from "~/hooks/use-is-pending";
import { EmailSchema, PasswordSchema } from "~/utils/types";

const LoginFormSchema = z.object({
  intent: z.string().optional(),
  email: EmailSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional(),
  remember: z.boolean().optional(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAnonymous(request); // make sure the user is not logged in
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAnonymous(request);
  const formData = await request.formData();

  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      LoginFormSchema.transform(async (data, ctx) => {
        if (intent !== null) return { ...data, session: null };

        const user = await verifyLogin(data.email, data.password);
        const redirectTo = safeRedirect(data.redirectTo, "/");

        if (!user) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid username or password",
          });
          return z.NEVER;
        }

        return { ...data, user, redirectTo };
      }),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.user) {
    return json(
      { result: submission.reply({ hideFields: ["password"] }) },
      { status: submission.status === "error" ? 400 : 200 },
    );
  }

  const { user, remember, redirectTo } = submission.value;

  return createUserSession({
    redirectTo,
    remember,
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Login to Chatmate" }];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/chatbots";
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending({ intent: "login" });

  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(LoginFormSchema),
    defaultValue: { redirectTo, intent: "login" },
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginFormSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <Card className="w-full max-w-[90%] sm:max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          method="post"
          className="flex flex-col gap-4 sm:gap-6"
          {...getFormProps(form)}
        >
          <Field
            labelProps={{ children: "Email" }}
            inputProps={{
              ...getInputProps(fields.email, { type: "email" }),
              autoFocus: true,
              className: "lowercase",
              autoComplete: "email",
            }}
            errors={fields.email.errors}
          />
          <Field
            labelProps={{ children: "Password" }}
            inputProps={{
              ...getInputProps(fields.password, {
                type: "password",
              }),
              autoComplete: "current-password",
            }}
            errors={fields.password.errors}
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <CheckboxField
              labelProps={{
                htmlFor: fields.remember.id,
                children: "Remember me",
              }}
              buttonProps={getInputProps(fields.remember, {
                type: "checkbox",
              })}
              errors={fields.remember.errors}
            />

            <Label asChild>
              <Link to="/forgot-password" className="text-sm">
                Forgot password?
              </Link>
            </Label>
          </div>

          <input {...getInputProps(fields.redirectTo, { type: "hidden" })} />
          <input {...getInputProps(fields.intent, { type: "hidden" })} />
          <ErrorList errors={form.errors} id={form.errorId} />

          <div className="flex flex-col gap-2 sm:gap-4">
            <StatusButton
              className="w-full"
              status={isPending ? "pending" : form.status ?? "idle"}
              type="submit"
              disabled={isPending}
            >
              Login
            </StatusButton>

            {/* <Form action="/auth/google" method="post" className="w-full">
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>Login with Google</span>
              </Button>
            </Form> */}
          </div>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/join" className="underline">
              Sign up
            </Link>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};
