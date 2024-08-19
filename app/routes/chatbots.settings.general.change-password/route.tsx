import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import bcrypt from "bcryptjs";

import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form, Link, useActionData } from "@remix-run/react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { ErrorList } from "~/components/ui/error-list";
import { Field } from "~/components/ui/field";
import { Label } from "~/components/ui/label";
import { StatusButton } from "~/components/ui/status-button";
import { prisma } from "~/db.server";
import { useIsPending } from "~/hooks/use-is-pending";
import { verifyLogin } from "~/models/user.server";
import { requireUser } from "~/session.server";
import { PasswordSchema } from "~/utils/types";

const ChangePasswordForm = z
  .object({
    intent: z.string().optional(),
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
    confirmNewPassword: PasswordSchema,
  })
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        path: ["confirmNewPassword"],
        code: z.ZodIssueCode.custom,
        message: "The passwords must match",
      });
    }
  });

// TODO - need to implement this for SSO users who don't have a password
// async function requirePassword(userId: string) {
//   const password = await prisma.password.findUnique({
//     select: { userId: true },
//     where: { userId },
//   })
//   if (!password) {
//     throw redirect('/settings/profile/password/create') -> this route is not implemented yet
//   }
// }

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser(request);

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ChangePasswordForm.superRefine(
      async ({ currentPassword, newPassword }, ctx) => {
        if (currentPassword && newPassword) {
          const verifiedUser = await verifyLogin(user.email, currentPassword);
          if (!verifiedUser) {
            ctx.addIssue({
              path: ["currentPassword"],
              code: z.ZodIssueCode.custom,
              message: "Incorrect password.",
            });
          }
        }
      },
    ),
  });
  if (submission.status !== "success") {
    return json(
      {
        result: submission.reply({
          hideFields: ["currentPassword", "newPassword", "confirmNewPassword"],
        }),
      },
      { status: submission.status === "error" ? 400 : 200 },
    );
  }

  const { newPassword } = submission.value;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: {
        update: {
          hash: hashedPassword,
        },
      },
    },
  });

  return redirect("/chatbots/settings/general");
};

export default function ChangePasswordPage() {
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending({ intent: "change-password" });
  const [showPassword, setShowPassword] = useState(false);

  const [form, fields] = useForm({
    id: "password-change-form",
    constraint: getZodConstraint(ChangePasswordForm),
    lastResult: actionData?.result,
    defaultValue: {
      intent: "change-password",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangePasswordForm });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Change your password by entering your current password and your new
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          method="POST"
          {...getFormProps(form)}
          className="flex flex-col gap-4 sm:gap-6"
        >
          <input type="hidden" name="intent" value="change-password" />
          <Field
            labelProps={{ children: "Current Password" }}
            inputProps={{
              ...getInputProps(fields.currentPassword, {
                type: showPassword ? "text" : "password",
              }),
              autoComplete: "current-password",
            }}
            errors={fields.currentPassword.errors}
          />
          <Field
            labelProps={{ children: "New Password" }}
            inputProps={{
              ...getInputProps(fields.newPassword, {
                type: showPassword ? "text" : "password",
              }),
              autoComplete: "new-password",
            }}
            errors={fields.newPassword.errors}
          />
          <Field
            labelProps={{ children: "Confirm New Password" }}
            inputProps={{
              ...getInputProps(fields.confirmNewPassword, {
                type: showPassword ? "text" : "password",
              }),
              autoComplete: "new-password",
            }}
            errors={fields.confirmNewPassword.errors}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-password"
              checked={showPassword}
              onCheckedChange={(state) =>
                setShowPassword(state.valueOf() as boolean)
              }
            />
            <Label htmlFor="show-password" className="text-sm">
              Show password
            </Label>
          </div>
          <ErrorList id={form.errorId} errors={form.errors} />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/chatbots/settings/general">Cancel</Link>
            </Button>
            <StatusButton
              className="w-full sm:w-auto"
              disabled={isPending}
              status={isPending ? "pending" : form.status ?? "idle"}
            >
              Change Password
            </StatusButton>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
