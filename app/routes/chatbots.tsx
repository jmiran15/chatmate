import { Outlet } from "@remix-run/react";
import { Navbar } from "~/components/navbar";

export default function ChatbotsLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
