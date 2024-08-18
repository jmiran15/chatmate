// app/services/auth.server.ts
import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { prisma } from "~/db.server";
import { sessionStorage, USER_SESSION_KEY } from "~/session.server";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
}

// Define a user type for cleaner typing
// export type ProviderUser = {
//   id: string;
//   email: string;
//   username?: string;
//   name?: string;
//   imageUrl?: string;
// };

// export const connectionSessionStorage = createCookieSessionStorage({
//   cookie: {
//     name: "en_connection",
//     sameSite: "lax", // CSRF protection is advised if changing to 'none'
//     path: "/",
//     httpOnly: true,
//     maxAge: 60 * 10, // 10 minutes
//     secrets: process.env.SESSION_SECRET!.split(","),
//     secure: process.env.NODE_ENV === "production",
//   },
// });

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
    callbackURL: "http://localhost:3000/auth/google/callback",
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile

    // console.log("google email - ", profile.emails[0].value);

    const { email, name, picture } = profile._json;

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

    return user.id;
  },
);

authenticator.use(googleStrategy, "google");
