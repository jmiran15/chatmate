// this is a layout, not page. it is the layout for all routers -> chatbots/:id ...
// it has a sidebar with "Chat", "Model", etc...

// this is AUTH PROTECTED!, I.E. IN THE LOADER CHECK IF WE HAVE USER IF NOT SEND BACK TO HOME
// in the loader we should also load the chatbot. This should refresh everytime a change is made to the chatbot (i.e. components)?????
// maybe not, since chatbots have chats, and dont want to refresh everytime a change to chats

import { NavLink, Outlet } from "@remix-run/react";

export default function Chatbot() {
  return (
    <main className="flex h-full bg-white">
      <div className="h-full w-80 border-r bg-gray-50">
        <ol>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="chat"
            >
              Chat
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="data"
            >
              Data
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="appearance"
            >
              Appearance
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="share"
            >
              Share
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="chats"
            >
              Chats
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
              }
              to="settings"
            >
              Settings
            </NavLink>
          </li>
        </ol>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </main>
  );
}
