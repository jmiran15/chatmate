import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import bcrypt from "bcryptjs";

import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
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
import { verifyLogin } from "~/models/user.server";
import { requireUser } from "~/session.server";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  try {
    const validatedData = ChangePasswordSchema.parse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    console.log("validatedData", validatedData.currentPassword);

    const verifiedUser = await verifyLogin(
      user.email,
      validatedData.currentPassword,
    );
    if (!verifiedUser) {
      return json(
        { errors: { currentPassword: "Invalid current password" } },
        { status: 400 },
      );
    }
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    await prisma.user.update({
      where: { id: verifiedUser.id },
      data: {
        password: {
          update: {
            hash: hashedPassword,
          },
        },
      },
    });

    return redirect("/chatbots/settings/general");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return json(
      { errors: { _form: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
};

export default function ChangePasswordPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.currentPassword) {
      currentPasswordRef.current?.focus();
    } else if (actionData?.errors?.newPassword) {
      newPasswordRef.current?.focus();
    } else if (actionData?.errors?.confirmPassword) {
      confirmPasswordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Change your password by entering your current password and your new
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="post" ref={formRef}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                ref={currentPasswordRef}
                id="currentPassword"
                name="currentPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={
                  actionData?.errors?.currentPassword ? true : undefined
                }
                aria-describedby="currentPassword-error"
              />
              {actionData?.errors?.currentPassword && (
                <p
                  className="pt-1 text-red-700 text-sm font-medium leading-none"
                  id="currentPassword-error"
                >
                  {actionData.errors.currentPassword}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                ref={newPasswordRef}
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={
                  actionData?.errors?.newPassword ? true : undefined
                }
                aria-describedby="newPassword-error"
              />
              {actionData?.errors?.newPassword && (
                <p
                  className="pt-1 text-red-700 text-sm font-medium leading-none"
                  id="newPassword-error"
                >
                  {actionData.errors.newPassword}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                ref={confirmPasswordRef}
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={
                  actionData?.errors?.confirmPassword ? true : undefined
                }
                aria-describedby="confirmPassword-error"
              />
              {actionData?.errors?.confirmPassword && (
                <p
                  className="pt-1 text-red-700 text-sm font-medium leading-none"
                  id="confirmPassword-error"
                >
                  {actionData.errors.confirmPassword}
                </p>
              )}
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="mr-2"
                />
                Show password
              </label>
            </div>
          </div>
        </Form>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Button variant="secondary" asChild>
          <Link to="/chatbots/settings/general">Cancel</Link>
        </Button>
        <Button
          disabled={navigation.state === "submitting"}
          onClick={() => submit(formRef.current)}
        >
          {navigation.state === "submitting"
            ? "Changing..."
            : "Change Password"}
        </Button>
      </CardFooter>
    </Card>
  );
}
