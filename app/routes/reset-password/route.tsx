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
import { Link, useActionData, useFetcher } from "@remix-run/react";
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
import { prisma } from "~/db.server";
import { ErrorList, Field } from "../forgot-password/route";
import { StatusButton } from "../forgot-password/statusButton";
import {
  resetPasswordEmailSessionKey,
  verifySessionStorage,
} from "../verify/verify.server";

const ChangePasswordSchema = z
  .object({
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
  // await requireAnonymous(request); TODO - make sure the user is logged out
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

  const verifySession = await verifySessionStorage.getSession();
  return redirect("/login", {
    headers: {
      "set-cookie": await verifySessionStorage.destroySession(verifySession),
    },
  });
};

export default function ChangePasswordPage() {
  const actionData = useActionData<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);
  const resetPassword = useFetcher();

  const isPending = resetPassword.state === "submitting";

  const [form, fields] = useForm({
    id: "reset-password",
    constraint: getZodConstraint(ChangePasswordSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangePasswordSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="flex justify-center items-center h-screen p-4">
      <Card className="w-full max-w-lg ">
        <CardHeader>
          <CardTitle>Password Reset</CardTitle>
          <CardDescription>
            Hi, fgfvbcf. No worries. It happens all the time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <resetPassword.Form
            method="post"
            ref={formRef}
            {...getFormProps(form)}
          >
            <div className="space-y-4">
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

              <ErrorList errors={form.errors} id={form.errorId} />
            </div>
          </resetPassword.Form>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button variant="secondary" asChild>
            <Link to="/chatbots/settings/general">Cancel</Link>
          </Button>

          <StatusButton
            className="w-full"
            status={isPending ? "pending" : form.status ?? "idle"}
            type="submit"
            disabled={isPending}
            onClick={() => resetPassword.submit(formRef.current)}
          >
            Reset password
          </StatusButton>
        </CardFooter>
      </Card>
    </div>
  );
}
