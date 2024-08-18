import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  json,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { useId, useRef } from "react";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { prisma } from "~/db.server";
import { prepareVerification } from "../verify/verify.server";
import { StatusButton } from "./statusButton";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const meta: MetaFunction = () => {
  return [{ title: "Password Recovery for Chatmate" }];
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const submission = await parseWithZod(formData, {
    schema: ForgotPasswordSchema.superRefine(async (data, ctx) => {
      const user = await prisma.user.findUniqueOrThrow({
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

  console.log(
    `dummy email sent to ${email} with otp ${otp} and verifyUrl ${verifyUrl}`,
  );

  // send the email with the otp and the link
  // const response = await sendEmail({
  //   to: user.email,
  //   subject: `Epic Notes Password Reset`,
  //   react: (
  //     <ForgotPasswordEmail onboardingUrl={verifyUrl.toString()} otp={otp} />
  //   ),
  // });

  return redirect(redirectTo.toString());

  // if (response.status === "success") {
  //   return redirect(redirectTo.toString());
  // } else {
  //   return json(
  //     { result: submission.reply({ formErrors: [response.error.message] }) },
  //     { status: 500 },
  //   );
  // }
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
    <div className="flex justify-center items-center h-screen p-4">
      <Card className="w-full max-w-lg ">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            No worries, we'll send you reset instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <forgotPassword.Form
            method="post"
            {...getFormProps(form)}
            ref={formRef}
          >
            <div>
              <Field
                labelProps={{
                  htmlFor: fields.email.id,
                  children: "Username or Email",
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
        <CardFooter className="flex items-center justify-between">
          <Button variant="secondary" asChild>
            <Link to="/login">Back to Login</Link>
          </Button>
          <StatusButton
            className="w-full"
            status={
              forgotPassword.state === "submitting"
                ? "pending"
                : form.status ?? "idle"
            }
            onClick={() => {
              forgotPassword.submit(formRef.current);
            }}
            disabled={forgotPassword.state !== "idle"}
          >
            Recover password
          </StatusButton>
        </CardFooter>
      </Card>
    </div>
  );
}

// TODO - move this stuff out and reuse in other forms
export type ListOfErrors = Array<string | null | undefined> | null | undefined;

export function Field({
  labelProps,
  inputProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  errors?: ListOfErrors;
  className?: string;
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Input
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...inputProps}
      />
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  );
}

export function ErrorList({
  id,
  errors,
}: {
  errors?: ListOfErrors;
  id?: string;
}) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className="flex flex-col gap-1">
      {errorsToRender.map((e) => (
        <li key={e} className="text-[10px] text-foreground-destructive">
          {e}
        </li>
      ))}
    </ul>
  );
}
