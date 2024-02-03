// chatbots/id/chat ...
// this is a layout route
// it has a sidebar to the right (same type as the one on the left), with a list of chats

import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, NavLink, Outlet } from "@remix-run/react";
import { createChatWithUser } from "~/models/chat.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const chatbotId = params.chatbotId as string;
  const userId = await requireUserId(request);

  const chat = await createChatWithUser({ chatbotId, userId });
  return redirect(chat.id);
};

export default function Chat() {
  return (
    <main className="flex h-full bg-white">
      <div className="flex-1 p-6">
        <Outlet />
      </div>
      <div className="h-full w-80 border-r bg-gray-50">
        <Form method="post">
          <button className="block p-4 text-xl text-blue-500" type="submit">
            + New Chat
          </button>
        </Form>

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
