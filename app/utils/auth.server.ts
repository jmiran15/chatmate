import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { prisma } from "~/db.server";
import { createCustomer } from "~/models/subscription.server";
import { sessionStorage, USER_SESSION_KEY } from "~/session.server";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
}

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30;
export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME);

export const authenticator = new Authenticator<string>(sessionStorage, {
  sessionKey: USER_SESSION_KEY,
});

let googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://chatmate.so"
    }/auth/google/callback`,
  },
  async ({ accessToken, refreshToken, extraParams, profile, context }) => {
    const { email, name, picture } = profile._json;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        picture,
        provider: "google",
      },
      create: {
        email,
        name,
        picture,
        provider: "google",
      },
    });

    if (!existingUser) {
      // TODO - remember that we have no credit card requirement now... so things will change!
      const updatedUser = await createCustomer({ userId: user.id });
      if (!updatedUser.customerId) throw new Error(`User not found.`);
    }

    console.log("user: ", user);
    return user.id;
  },
);

authenticator.use(googleStrategy, "google");
