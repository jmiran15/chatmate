// chatbots/id/chat ...
// this is a layout route
// it has a sidebar to the right (same type as the one on the left), with a list of chats

import { Link, NavLink, Outlet } from "@remix-run/react";

export default function Chat() {
  return (
    <main className="flex h-full bg-white">
      <div className="flex-1 p-6">
        <Outlet />
      </div>
      <div className="h-full w-80 border-r bg-gray-50">
        <Link to="new" className="block p-4 text-xl text-blue-500">
          + New Chat
        </Link>

        <hr />
        <ol>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="asd"
            >
              this is a chat
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="xcv"
            >
              another chat
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="e"
            >
              2nd
            </NavLink>
          </li>
        </ol>
      </div>
    </main>
  );
}
