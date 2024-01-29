// should we have the header here? since this is the root layout??? we can get the user in the loader and change header accordingly

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { registerLicense } from "@syncfusion/ej2-base";

import "@mantine/core/styles.css";

import { getUser } from "~/session.server";
import stylesheet from "~/tailwind.css";

import { GraphProvider } from "./context/graph";
import { ProjectProvider } from "./context/project";

// import "../node_modules/@syncfusion/ej2-base/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-icons/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-buttons/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-splitbuttons/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-inputs/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-lists/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-navigations/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-popups/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-react-richtexteditor/styles/bootstrap5.css";
// import "../node_modules/@syncfusion/ej2-react-dropdowns/styles/bootstrap5.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!process.env.SYNCFUSION_LICENSE_KEY) {
    throw new Error("Missing Syncfusion License Key");
  }
  registerLicense(process.env.SYNCFUSION_LICENSE_KEY);

  return json({ user: await getUser(request) });
};

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body className="min-h-screen h-full flex flex-col">
        <MantineProvider>
          <ProjectProvider>
            <GraphProvider>
              <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
                <h1 className="text-3xl font-bold">
                  <Link to=".">Home</Link>
                </h1>
                {data.user ? (
                  <div className="flex items-center justify-center gap-x-4">
                    <Link
                      to="/chatbots"
                      className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-base font-medium text-blue-700 shadow-sm hover:bg-blue-50 sm:px-8"
                    >
                      View Chatbots for {data.user.email}
                    </Link>
                    <Form action="/logout" method="post">
                      <button
                        type="submit"
                        className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
                      >
                        Logout
                      </button>
                    </Form>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-x-4">
                    <Link
                      to="/join"
                      className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-blue-700 shadow-sm hover:bg-blue-50 sm:px-8"
                    >
                      Sign up
                    </Link>
                    <Link
                      to="/login"
                      className="flex items-center justify-center rounded-md bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600"
                    >
                      Log In
                    </Link>
                  </div>
                )}
              </header>
              <Outlet />
              <ScrollRestoration />
              <Scripts />
              <LiveReload />
            </GraphProvider>
          </ProjectProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
