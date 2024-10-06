import { SEOHandle } from "@nasa-gcn/remix-seo";
import { NavLink, Outlet } from "@remix-run/react";

export default function Settings() {
  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-white p-4 md:gap-8 md:p-10 h-full overflow-y-auto ">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
        <nav className="grid gap-4 text-sm text-muted-foreground">
          <NavLink
            to="/chatbots/settings/general"
            className={({ isActive }) =>
              `${isActive ? "font-semibold text-primary" : ""}`
            }
          >
            General
          </NavLink>
          <NavLink
            to="/chatbots/settings/billing"
            className={({ isActive }) =>
              `${isActive ? "font-semibold text-primary" : ""}`
            }
          >
            Billing
          </NavLink>
        </nav>
        <Outlet />
      </div>
    </main>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};
