import { type Submission } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { json, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { z } from "zod";
import { prisma } from "~/db.server";
import { createUserSession } from "~/session.server";
import {
  VerifySchema,
  codeQueryParam,
  redirectToQueryParam,
  targetQueryParam,
  typeQueryParam,
  type VerificationTypes,
} from "./route";
import { generateTOTP, verifyTOTP } from "./totp.server";

export function getDomainUrl(request: Request) {
  const host =
    request.headers.get("X-Forwarded-Host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  const protocol = request.headers.get("X-Forwarded-Proto") ?? "http";
  return `${protocol}://${host}`;
}

import { createCookieSessionStorage } from "@remix-run/node";
import { createCustomer, stripe } from "~/models/subscription.server";
import {
  joinPasswordHashSessionKey,
  priceIdSessionKey,
} from "../_auth.join/route";
import { handleChangeEmailVerification } from "../chatbots.settings.general.change-email/emails.server";

export const verifySessionStorage = createCookieSessionStorage({
  cookie: {
    name: "en_verification",
    sameSite: "lax", // CSRF protection is advised if changing to 'none'
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    secrets: process.env.SESSION_SECRET!.split(","),
    secure: process.env.NODE_ENV === "production",
  },
});

export type VerifyFunctionArgs = {
  request: Request;
  submission: Submission<
    z.input<typeof VerifySchema>,
    string[],
    z.output<typeof VerifySchema>
  >;
  body: FormData | URLSearchParams;
};

export function getRedirectToUrl({
  request,
  type,
  target,
  redirectTo,
}: {
  request: Request;
  type: VerificationTypes;
  target: string;
  redirectTo?: string;
}) {
  const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`); // base
  redirectToUrl.searchParams.set(typeQueryParam, type); // set the type, e.g, type=onboarding
  redirectToUrl.searchParams.set(targetQueryParam, target); // set the target, e.g, target=email@email.com
  if (redirectTo) {
    redirectToUrl.searchParams.set(redirectToQueryParam, redirectTo); // optional redirect to a specific page after verification, e.g, redirectTo=/profile
  }
  return redirectToUrl;
}

// creates a verification and returns otp, redirectTo url for email and redirection
export async function prepareVerification({
  period,
  request,
  type,
  target,
}: {
  period: number;
  request: Request;
  type: VerificationTypes;
  target: string;
}) {
  const verifyUrl = getRedirectToUrl({ request, type, target });
  const redirectTo = new URL(verifyUrl.toString());

  const { otp, ...verificationConfig } = generateTOTP({
    algorithm: "SHA256",
    // Leaving off 0, O, and I on purpose to avoid confusing users.
    charSet: "ABCDEFGHJKLMNPQRSTUVWXYZ123456789",
    period,
  });
  const verificationData = {
    type,
    target,
    ...verificationConfig,
    expiresAt: new Date(Date.now() + verificationConfig.period * 1000),
  };
  await prisma.verification.upsert({
    where: { target_type: { target, type } },
    create: verificationData,
    update: verificationData,
  });

  // add the otp to the url we'll email the user.
  verifyUrl.searchParams.set(codeQueryParam, otp);

  return { otp, redirectTo, verifyUrl };
}

// boilerplate for validating a OTP from @epic-web/totp
export async function isCodeValid({
  code,
  type,
  target,
}: {
  code: string;
  type: VerificationTypes;
  target: string;
}) {
  const verification = await prisma.verification.findUnique({
    where: {
      target_type: { target, type },
      OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
    },
    select: { algorithm: true, secret: true, period: true, charSet: true },
  });
  if (!verification) return false;
  const result = verifyTOTP({
    otp: code,
    ...verification,
  });
  if (!result) return false;

  return true;
}

export async function validateRequest(
  request: Request,
  body: URLSearchParams | FormData,
) {
  const submission = await parseWithZod(body, {
    schema: VerifySchema.superRefine(async (data, ctx) => {
      const codeIsValid = await isCodeValid({
        code: data[codeQueryParam],
        type: data[typeQueryParam],
        target: data[targetQueryParam],
      });
      if (!codeIsValid) {
        ctx.addIssue({
          path: ["code"],
          code: z.ZodIssueCode.custom,
          message: `Invalid code`,
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

  const { value: submissionValue } = submission;

  async function deleteVerification() {
    await prisma.verification.delete({
      where: {
        target_type: {
          type: submissionValue[typeQueryParam],
          target: submissionValue[targetQueryParam],
        },
      },
    });
  }

  switch (submissionValue[typeQueryParam]) {
    case "reset-password": {
      await deleteVerification();
      return handleResetPasswordVerification({ request, body, submission });
    }
    case "onboarding": {
      await deleteVerification();
      return handleOnboardingVerification({ request, body, submission });
    }
    case "change-email": {
      await deleteVerification();
      return handleChangeEmailVerification({ request, body, submission });
    }
  }
}

export async function handleOnboardingVerification({
  request,
  submission,
}: VerifyFunctionArgs) {
  invariant(
    submission.status === "success",
    "Submission should be successful by now",
  );
  const email = submission.value.target;

  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const joinPasswordHash = verifySession.get(joinPasswordHashSessionKey);
  if (typeof joinPasswordHash !== "string" || !joinPasswordHash) {
    throw redirect("/join");
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: joinPasswordHash,
        },
      },
    },
  });

  // TODO - switch to Paddle
  const updatedUser = await createCustomer({ userId: user.id });
  if (!updatedUser.customerId) throw new Error(`User not found.`);

  const priceId = verifySession.get(priceIdSessionKey);

  // const checkoutUrl = await createSubscriptionCheckout({
  //   userId: user.id,
  //   priceId,
  //   successUrl: "/chatbots?success=true",
  //   cancelUrl: "/",
  // });

  const subscription = await stripe.subscriptions.create({
    customer: updatedUser.customerId!,
    items: [
      {
        price: priceId,
      },
    ],
    trial_period_days: 7,
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    trial_settings: {
      end_behavior: {
        missing_payment_method: "pause",
      },
    },
  });

  try {
    const dbSubscription = await prisma.subscription.create({
      data: {
        id: subscription.id,
        userId: user.id,
        planId: String(subscription.items.data[0].plan.product),
        priceId: String(subscription.items.data[0].price.id),
        interval: String(subscription.items.data[0].plan.interval),
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
      },
    });

    console.log("dbSubscription created for new Google user: ", dbSubscription);
  } catch (err: unknown) {
    console.log(err);
    throw new Error("Unable to create free trial subscription");
  }

  // clear the priceId from the session
  verifySession.unset(priceIdSessionKey);

  // TODO - fix the remember me stuff so that it works with the join flow
  return createUserSession({
    redirectTo: "/chatbots?trialInitialized=true",
    remember: true,
    request,
    userId: user.id,
  });
}

export const resetPasswordEmailSessionKey = "resetPasswordEmail";

export async function handleResetPasswordVerification({
  submission,
}: VerifyFunctionArgs) {
  invariant(
    submission.status === "success",
    "Submission should be successful by now",
  );
  const target = submission.value.target; // email
  const user = await prisma.user.findFirst({
    where: { email: target },
    select: { email: true },
  });
  // we don't want to say the user is not found if the email is not found
  // because that would allow an attacker to check if an email is registered
  if (!user) {
    return json(
      { result: submission.reply({ fieldErrors: { code: ["Invalid code"] } }) },
      { status: 400 },
    );
  }

  const verifySession = await verifySessionStorage.getSession();
  verifySession.set(resetPasswordEmailSessionKey, user.email);
  return redirect("/reset-password", {
    headers: {
      "set-cookie": await verifySessionStorage.commitSession(verifySession),
    },
  });
}
