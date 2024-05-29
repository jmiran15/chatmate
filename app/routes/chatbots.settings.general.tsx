import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import ChangeEmail from "~/components/settings/change-email";
import DeleteAccount from "~/components/settings/delete-account";

import { deleteUserByEmail, updateUserEmail } from "~/models/user.server";
import { requireUser, requireUserId } from "~/session.server";
import { validateEmail } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ user: await requireUser(request) });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const userId = await requireUserId(request);
  const intent = String(formData.get("intent"));

  console.log("intent", intent);

  switch (intent) {
    case "changeEmail": {
      const email = String(formData.get("email"));
      if (!validateEmail(email)) {
        return json(
          { errors: { email: "Email is invalid", password: null } },
          { status: 400 },
        );
      }

      return await updateUserEmail(userId, email);
    }
    case "deleteAccount": {
      return await deleteUserByEmail(userId);
    }
    default:
      throw new Error("Invalid intent");
  }
};

export default function GeneralSettings() {
  return (
    <div className="grid gap-6 ">
      <ChangeEmail />
      <DeleteAccount />
    </div>
  );
}
