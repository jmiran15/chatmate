import bcrypt from "bcryptjs";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
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
import { prisma } from "~/db.server";
import { useIsPending } from "~/hooks/use-is-pending";
import { requireAnonymous } from "~/session.server";
import {
  resetPasswordEmailSessionKey,
  verifySessionStorage,
} from "../_auth.verify/verify.server";

const ChangePasswordSchema = z
  .object({
    intent: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const meta: MetaFunction = () => {
  return [{ title: "Reset Password | Chatmate" }];
};

async function requireResetPasswordEmail(request: Request) {
  await requireAnonymous(request);
  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const resetPasswordEmail = verifySession.get(resetPasswordEmailSessionKey);
  if (typeof resetPasswordEmail !== "string" || !resetPasswordEmail) {
    throw redirect("/login");
  }
  return resetPasswordEmail;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const resetPasswordEmail = await requireResetPasswordEmail(request);
  return json({ resetPasswordEmail });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const resetPasswordEmail = await requireResetPasswordEmail(request);
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: ChangePasswordSchema,
  });
  if (submission.status !== "success") {
    return json(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 },
    );
  }
  const { newPassword } = submission.value;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    await prisma.user.update({
      where: { email: resetPasswordEmail },
      data: {
        password: {
          update: {
            hash: hashedPassword,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return json(
      {
        result: {
          status: "error",
          message: "Failed to update password. Please try again.",
        },
      },
      { status: 500 },
    );
  }

  const verifySession = await verifySessionStorage.getSession();
  return redirect("/login", {
    headers: {
      "set-cookie": await verifySessionStorage.destroySession(verifySession),
    },
  });
};

export default function ChangePasswordPage() {
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending({ intent: "resetPassword" });

  const [form, fields] = useForm({
    id: "reset-password",
    constraint: getZodConstraint(ChangePasswordSchema),
    defaultValue: {
      intent: "resetPassword",
    },
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangePasswordSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <Card className="w-full max-w-[90%] sm:max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          method="post"
          {...getFormProps(form)}
          className="flex flex-col gap-4 sm:gap-6"
        >
          <Field
            labelProps={{
              htmlFor: fields.newPassword.id,
              children: "New Password",
            }}
            inputProps={{
              ...getInputProps(fields.newPassword, { type: "password" }),
              autoComplete: "new-password",
              autoFocus: true,
            }}
            errors={fields.newPassword.errors}
          />
          <Field
            labelProps={{
              htmlFor: fields.confirmPassword.id,
              children: "Confirm Password",
            }}
            inputProps={{
              ...getInputProps(fields.confirmPassword, {
                type: "password",
              }),
              autoComplete: "new-password",
            }}
            errors={fields.confirmPassword.errors}
          />
          <input
            {...getInputProps(fields.intent, {
              type: "hidden",
            })}
          />
          <ErrorList errors={form.errors} id={form.errorId} />

          <div className="flex flex-col gap-2 sm:gap-4">
            <StatusButton
              className="w-full"
              status={isPending ? "pending" : form.status ?? "idle"}
              type="submit"
              disabled={isPending}
            >
              Reset password
            </StatusButton>
            <Button variant="outline" asChild className="w-full">
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
