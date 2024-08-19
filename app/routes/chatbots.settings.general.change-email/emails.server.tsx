import * as E from "@react-email/components";
import { json, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { sendEmail } from "~/utils/email.server";

import {
  VerifyFunctionArgs,
  verifySessionStorage,
} from "../_auth.verify/verify.server";

export const newEmailAddressSessionKey = "new-email-address";

export async function handleChangeEmailVerification({
  request,
  submission,
}: VerifyFunctionArgs) {
  // await requireRecentVerification(request)
  invariant(
    submission.status === "success",
    "Submission should be successful by now",
  );

  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const newEmail = verifySession.get(newEmailAddressSessionKey);
  if (!newEmail) {
    return json(
      {
        result: submission.reply({
          formErrors: [
            "You must submit the code on the same device that requested the email change.",
          ],
        }),
      },
      { status: 400 },
    );
  }
  const preUpdateUser = await prisma.user.findFirstOrThrow({
    select: { email: true },
    where: { id: submission.value.target },
  });
  const user = await prisma.user.update({
    where: { id: submission.value.target },
    select: { id: true, email: true },
    data: { email: newEmail },
  });

  void sendEmail({
    to: preUpdateUser.email,
    subject: "Chatmate email changed",
    react: <EmailChangeNoticeEmail userId={user.id} />,
  });

  return redirect("/chatbots/settings/general", {
    headers: {
      "set-cookie": await verifySessionStorage.destroySession(verifySession),
    },
  });
}

export function EmailChangeEmail({
  verifyUrl,
  otp,
}: {
  verifyUrl: string;
  otp: string;
}) {
  return (
    <E.Html lang="en" dir="ltr">
      <E.Container>
        <h1>
          <E.Text>Chatmate Email Change</E.Text>
        </h1>
        <p>
          <E.Text>
            Here's your verification code: <strong>{otp}</strong>
          </E.Text>
        </p>
        <p>
          <E.Text>Or click the link:</E.Text>
        </p>
        <E.Link href={verifyUrl}>{verifyUrl}</E.Link>
      </E.Container>
    </E.Html>
  );
}

export function EmailChangeNoticeEmail({ userId }: { userId: string }) {
  return (
    <E.Html lang="en" dir="ltr">
      <E.Container>
        <h1>
          <E.Text>Your Chatmate email has been changed</E.Text>
        </h1>
        <p>
          <E.Text>
            We're writing to let you know that your Chatmate email has been
            changed.
          </E.Text>
        </p>
        <p>
          <E.Text>
            If you changed your email address, then you can safely ignore this.
            But if you did not change your email address, then please contact
            support immediately.
          </E.Text>
        </p>
        <p>
          <E.Text>Your Account ID: {userId}</E.Text>
        </p>
      </E.Container>
    </E.Html>
  );
}
