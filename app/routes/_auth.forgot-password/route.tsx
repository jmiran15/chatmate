import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  json,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { useRef } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ErrorList } from "~/components/ui/error-list";
import { Field } from "~/components/ui/field";
import { prisma } from "~/db.server";
import { sendEmail } from "~/utils/email.server";
import { StatusButton } from "../../components/ui/status-button";
import { EmailSchema } from "../_auth.login/route";
import { prepareVerification } from "../verify/verify.server";
import { ForgotPasswordEmail } from "./email";

const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const meta: MetaFunction = () => {
  return [{ title: "Password Recovery for Chatmate" }];
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const submission = await parseWithZod(formData, {
    schema: ForgotPasswordSchema.superRefine(async (data, ctx) => {
      const user = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
        select: { id: true },
      });
      if (!user) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "No user exists with this email",
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

  const { email } = submission.value;

  // TODO - is this needed?
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { email: true },
  });

  const { verifyUrl, redirectTo, otp } = await prepareVerification({
    period: 10 * 60,
    request,
    type: "reset-password",
    target: email,
  });

  const response = await sendEmail({
    to: user.email,
    subject: `Chatmate Password Reset`,
    react: (
      <ForgotPasswordEmail onboardingUrl={verifyUrl.toString()} otp={otp} />
    ),
  });

  if (response.status === "success") {
    return redirect(redirectTo.toString());
  } else {
    return json(
      { result: submission.reply({ formErrors: [response.error.message] }) },
      { status: 500 },
    );
  }
};

export default function ForgotPassword() {
  const forgotPassword = useFetcher<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);

  const [form, fields] = useForm({
    id: "forgot-password-form",
    constraint: getZodConstraint(ForgotPasswordSchema),
    lastResult: forgotPassword.data?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ForgotPasswordSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <Card className="w-full max-w-[90%] sm:max-w-md md:max-w-lg">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Don&apos;t worry! Fill in your email and we&apos;ll send you a link to
          reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <forgotPassword.Form
          method="post"
          {...getFormProps(form)}
          ref={formRef}
          className="space-y-4"
        >
          <div>
            <Field
              labelProps={{
                htmlFor: fields.email.id,
                children: "Email",
              }}
              inputProps={{
                autoFocus: true,
                ...getInputProps(fields.email, { type: "text" }),
              }}
              errors={fields.email.errors}
            />
          </div>
          <ErrorList errors={form.errors} id={form.errorId} />
        </forgotPassword.Form>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <Button variant="secondary" asChild className="w-full sm:w-auto">
          <Link to="/login">Back to Login</Link>
        </Button>
        <StatusButton
          status={
            forgotPassword.state === "submitting"
              ? "pending"
              : form.status ?? "idle"
          }
          onClick={() => {
            forgotPassword.submit(formRef.current);
          }}
          disabled={forgotPassword.state !== "idle"}
          className="w-full sm:w-auto"
        >
          Recover password
        </StatusButton>
      </CardFooter>
    </Card>
  );
}
