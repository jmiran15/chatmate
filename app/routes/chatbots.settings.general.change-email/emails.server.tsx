import { json, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { sendEmail } from "~/utils/email.server";

import EmailChangeNoticeEmail from "emails/change-email-notice";
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
