import { Outlet } from "@remix-run/react";

export default function Chatbot() {
  return (
    <div>
      a chatbot this is the layout, i.e. sidebar and stuff
      <Outlet />
    </div>
  );
}
