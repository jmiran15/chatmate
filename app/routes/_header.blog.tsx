import { Outlet } from "@remix-run/react";

export default function Component() {
  return (
    <div className="p-10 prose">
      <h1>Blog</h1>
      <Outlet />
    </div>
  );
}
