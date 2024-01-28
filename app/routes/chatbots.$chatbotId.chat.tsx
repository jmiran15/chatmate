import { Outlet } from "@remix-run/react";

export default function Chat() {
  return (
    <div>
      <h1>
        THIS IS THE LAYOUT ROUTE FOR CHATS, I.E. empty chat and list of chats on
        the right
      </h1>
      <Outlet />
    </div>
  );
}
