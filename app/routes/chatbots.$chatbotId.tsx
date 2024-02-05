// this is a layout, not page. it is the layout for all routers -> chatbots/:id ...
// it has a sidebar with "Chat", "Model", etc...

// this is AUTH PROTECTED!, I.E. IN THE LOADER CHECK IF WE HAVE USER IF NOT SEND BACK TO HOME
// in the loader we should also load the chatbot. This should refresh everytime a change is made to the chatbot (i.e. components)?????
// maybe not, since chatbots have chats, and dont want to refresh everytime a change to chats

import { Outlet, useFetcher, useLoaderData } from "@remix-run/react";

import { useState } from "react";
import {
  MessageSquareMore,
  Database,
  Brush,
  Share,
  MessagesSquare,
  Settings,
} from "lucide-react";

import { Nav } from "~/components/nav";
import { cn } from "~/lib/utils";
import { TooltipProvider } from "~/components/ui/tooltip";
import { layoutPanel, collapsedPanel } from "~/cookies.server";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  createCookie,
  json,
} from "@remix-run/node";

interface ChatbotLayoutProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

// function parseCookies(cookieHeader: string | null) {
//   const cookies = {};
//   if (cookieHeader) {
//     const cookieArray = cookieHeader.split("; ");
//     cookieArray.forEach((cookie) => {
//       const [name, value] = cookie.split("=");
//       cookies[name] = value;
//     });
//   }
//   return cookies;
// }

// export async function action({ request }: ActionFunctionArgs) {
//   // update the layout and collapsed cookies with fetcher
//   const formData = await request.formData();
//   const layout = formData.get("react-resizable-panels:layout") as string;
//   console.log("LAYOUT", layout);

//   return null;
// }

// export async function loader({ request }: LoaderFunctionArgs) {
//   const cookieHeader = request.headers.get("Cookie");
//   const cookies = parseCookies(cookieHeader);

//   // get the starter values for layout and collapsed from the cookies.
//   // create remix cookie for layout and collapsed

//   return json({ cookies });
// }

export default function ChatbotLayout({
  defaultLayout = [265, 1095],
  defaultCollapsed = false,
  navCollapsedSize = 4,
}: ChatbotLayoutProps) {
  // const data = useLoaderData<typeof loader>();
  // const layout = data.cookies?.["react-resizable-panels:layout"];
  // const collapsed = data.cookies?.["react-resizable-panels:collapsed"];
  // const fetcher = useFetcher();

  // const defaultLayout = layout ? JSON.parse(layout) : undefined;
  // const defaultCollapsed = collapsed
  //   ? collapsed === "undefined"
  //     ? undefined
  //     : JSON.parse(collapsed)
  //   : undefined;
  // const navCollapsedSize = 4;
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  console.log("isCollapsed", isCollapsed, defaultCollapsed);

  return (
    // <main className="flex h-full bg-white">
    //   <div className="h-full w-80 border-r bg-gray-50">
    //     <ol>
    //       <li>
    //         <NavLink
    //           className={({ isActive }) =>
    //             `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
    //           }
    //           to="chat"
    //         >
    //           Chat
    //         </NavLink>
    //       </li>
    //       <li>
    //         <NavLink
    //           className={({ isActive }) =>
    //             `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
    //           }
    //           to="data"
    //         >
    //           Data
    //         </NavLink>
    //       </li>
    //       <li>
    //         <NavLink
    //           className={({ isActive }) =>
    //             `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
    //           }
    //           to="appearance"
    //         >
    //           Appearance
    //         </NavLink>
    //       </li>
    //       <li>
    //         <NavLink
    //           className={({ isActive }) =>
    //             `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
    //           }
    //           to="share"
    //         >
    //           Share
    //         </NavLink>
    //       </li>
    //       <li>
    //         <NavLink
    //           className={({ isActive }) =>
    //             `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
    //           }
    //           to="chats"
    //         >
    //           Chats
    //         </NavLink>
    //       </li>
    //       <li>
    //         <NavLink
    //           className={({ isActive }) =>
    //             `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
    //           }
    //           to="settings"
    //         >
    //           Settings
    //         </NavLink>
    //       </li>
    //     </ol>
    //   </div>
    //   <div className="flex-1">
    //     <Outlet />
    //   </div>
    // </main>
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          // console.log("called on Layout", sizes);
          // const formData = new FormData();
          // formData.append(
          //   "react-resizable-panels:layout",
          //   JSON.stringify(sizes),
          // );
          // fetcher.submit(formData, { method: "POST" });
          // document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          //   sizes,
          // )}`;
        }}
        className="h-full max-h-[800px] items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          // onCollapse={(collapsed) => {
          //   console.log("collapsed", collapsed);
          //   setIsCollapsed(collapsed);
          //   // document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
          //   //   collapsed,
          //   // )}`;
          // }}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
          className={cn(
            isCollapsed &&
              "min-w-[50px] transition-all duration-300 ease-in-out",
          )}
        >
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Chat",
                path: "chat",
                icon: MessageSquareMore,
              },
              {
                title: "Data",
                path: "data",
                icon: Database,
              },
              {
                title: "Appearance",
                path: "appearance",
                icon: Brush,
              },
              {
                title: "Share",
                path: "share",
                icon: Share,
              },
              {
                title: "Chats",
                path: "chats",
                icon: MessagesSquare,
              },
              {
                title: "Settings",
                path: "settings",
                icon: Settings,
              },
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]}>
          <Outlet />
          {/* <MailDisplay
          mail={mails.find((item) => item.id === mail.selected) || null}
        /> */}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
