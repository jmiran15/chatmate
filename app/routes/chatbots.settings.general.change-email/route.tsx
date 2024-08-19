import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
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
import { requireUserId } from "~/session.server";
import { EmailSchema } from "~/utils/types";
import {
  newEmailAddressSessionKey,
  prepareVerification,
  verifySessionStorage,
} from "../_auth.verify/verify.server";

const ChangeEmailSchema = z.object({
  intent: z.string().optional(),
  email: EmailSchema,
});

export async function loader({ request }: LoaderFunctionArgs) {
  // await requireRecentVerification(request);
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) {
    const params = new URLSearchParams({ redirectTo: request.url });
    throw redirect(`/login?${params}`);
  }
  return json({ user });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: ChangeEmailSchema.superRefine(async (data, ctx) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "This email is already in use.",
        });
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

  const { otp, redirectTo, verifyUrl } = await prepareVerification({
    period: 10 * 60,
    request,
    target: userId,
    type: "change-email",
  });

  // send the email
  // const response = await sendEmail({
  // 	to: submission.value.email,
  // 	subject: `Epic Notes Email Change Verification`,
  // 	react: <EmailChangeEmail verifyUrl={verifyUrl.toString()} otp={otp} />,
  // })

  console.log(
    `dummy email sent to ${submission.value.email} with otp ${otp} and verifyUrl ${verifyUrl}`,
  );

  const verifySession = await verifySessionStorage.getSession();
  verifySession.set(newEmailAddressSessionKey, submission.value.email);
  return redirect(redirectTo.toString(), {
    headers: {
      "set-cookie": await verifySessionStorage.commitSession(verifySession),
    },
  });

  // if (response.status === 'success') {
  // const verifySession = await verifySessionStorage.getSession()
  // verifySession.set(newEmailAddressSessionKey, submission.value.email)
  // return redirect(redirectTo.toString(), {
  // 	headers: {
  // 		'set-cookie': await verifySessionStorage.commitSession(verifySession),
  // 	},
  // })
  // } else {
  // 	return json(
  // 		{ result: submission.reply({ formErrors: [response.error.message] }) },
  // 		{ status: 500 },
  // 	)
  // }
};

export default function ChangeEmail() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const isPending = useIsPending({ intent: "changeEmail" });

  const [form, fields] = useForm({
    id: "change-email-form",
    constraint: getZodConstraint(ChangeEmailSchema),
    lastResult: actionData?.result,
    defaultValue: {
      intent: "changeEmail",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangeEmailSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Change Email</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          You will receive an email at the new email address to confirm. An
          email notice will also be sent to your old address{" "}
          <span className="font-semibold">{loaderData?.user?.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          method="POST"
          {...getFormProps(form)}
          className="flex flex-col gap-4 sm:gap-6"
        >
          <input type="hidden" name="intent" value="changeEmail" />
          <Field
            labelProps={{ children: "New Email" }}
            inputProps={{
              ...getInputProps(fields.email, { type: "email" }),
              autoComplete: "email",
              className: "lowercase",
            }}
            errors={fields.email.errors}
          />
          <ErrorList id={form.errorId} errors={form.errors} />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/chatbots/settings/general">Cancel</Link>
            </Button>
            <StatusButton
              type="submit"
              className="w-full sm:w-auto"
              status={isPending ? "pending" : form.status ?? "idle"}
              disabled={isPending}
            >
              Send Confirmation
            </StatusButton>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
