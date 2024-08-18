import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ErrorList } from "~/components/ui/error-list";
import { Field } from "~/components/ui/field";
import { prisma } from "~/db.server";
import { requireUserId } from "~/session.server";
import { StatusButton } from "../../components/ui/status-button";
import { EmailSchema } from "../_auth.login/route";
import {
  newEmailAddressSessionKey,
  prepareVerification,
  verifySessionStorage,
} from "../verify/verify.server";

const ChangeEmailSchema = z.object({
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
  const navigation = useNavigation();

  const [form, fields] = useForm({
    id: "change-email-form",
    constraint: getZodConstraint(ChangeEmailSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangeEmailSchema });
    },
  });

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Change Email</CardTitle>
        <CardDescription>
          You will receive an email at the new email address to confirm. An
          email notice will also be sent to your old address{" "}
          <span className="font-semibold">{loaderData?.user?.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="POST" {...getFormProps(form)}>
          <input type="hidden" name="intent" value="changeEmail" />

          <Field
            labelProps={{ children: "New Email" }}
            inputProps={{
              ...getInputProps(fields.email, { type: "email" }),
              autoComplete: "email",
            }}
            errors={fields.email.errors}
          />
          <ErrorList id={form.errorId} errors={form.errors} />
          <StatusButton
            type="submit"
            status={
              navigation.state === "loading"
                ? "pending"
                : navigation.state === "idle"
                ? "idle"
                : "success"
            }
          >
            Send Confirmation
          </StatusButton>
        </Form>
      </CardContent>
    </Card>
  );
}
