// this is a layout, not page. it is the layout for all routers -> chatbots/:id ...
// it has a sidebar with "Chat", "Model", etc...

// this is AUTH PROTECTED!, I.E. IN THE LOADER CHECK IF WE HAVE USER IF NOT SEND BACK TO HOME
// in the loader we should also load the chatbot. This should refresh everytime a change is made to the chatbot (i.e. components)?????
// maybe not, since chatbots have chats, and dont want to refresh everytime a change to chats

import { Outlet } from "@remix-run/react";

export default function Chatbot() {
  return (
    <div>
      a chatbot this is the layout, i.e. sidebar and stuff
      <Outlet />
    </div>
  );
}
