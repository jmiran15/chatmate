import { LoaderFunctionArgs, json } from "@remix-run/node";
import ChangeEmail from "./change-email";
import DeleteAccount from "./delete-account";

import { SEOHandle } from "@nasa-gcn/remix-seo";
import { requireUser } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ user: await requireUser(request) });
};

export default function GeneralSettings() {
  return (
    <div className="grid gap-6 ">
      <ChangeEmail />
      <DeleteAccount />
    </div>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};
