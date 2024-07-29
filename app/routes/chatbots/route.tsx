import { Outlet } from "@remix-run/react";
import { Header } from "~/routes/_index/header";

// should probably add loader for auth check here?

export default function ChatbotsLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
