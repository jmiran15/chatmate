import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
// import Stripe from "stripe";

// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error("STRIPE_SECRET_KEY is not defined");
// }

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: User["email"], password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  // await ensureStripeCustomer(user);
  return user;
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function updateUserEmail(
  userId: User["id"],
  email: User["email"],
) {
  return prisma.user.update({ where: { id: userId }, data: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"],
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  console.log("userWithPassword", userWithPassword);

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash,
  );

  if (!isValid) {
    return null;
  }

  // ensureStripeCustomer(userWithPassword);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

// get all users
export async function getAllUsers() {
  return prisma.user.findMany();
}

// const ensureStripeCustomer = async (user: User) => {
//   // Check to see if there's a stripe customer ID on the user
//   if (user.customerId) {
//     return;
//   }

//   const customerParams = {
//     email: user.email,
//     metadata: {
//       userId: user.id,
//     },
//   };

//   if (process.env.NODE_ENV == "development") {
//     // Create a test clock
//     // pass that on customer params
//     const testClock = await stripe.testHelpers.testClocks.create({
//       frozen_time: Math.floor(new Date().getTime() / 1000),
//     });
//     customerParams.test_clock = testClock.id;
//   }

//   // otherwise create a stripe customer
//   const customer = await stripe.customers.create(customerParams);
//   await prisma.user.update({
//     where: { id: user.id },
//     data: {
//       customerId: customer.id,
//     },
//   });
// };

export async function isProUser(userId: User["id"]) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
    },
  });

  if (user?.subscription?.planId === "pro") {
    return true;
  }

  return false;
}
