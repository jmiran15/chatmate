import { json, useLoaderData } from "@remix-run/react";

import Chat from "~/components/ChatComponent";
import Document from "~/components/DocumentComponent";
import type { LoaderFunctionArgs } from "@remix-run/node";

import {
  Chat as ChatInterface,
  Document as DocumentInterface,
} from "~/reducers/graphReducer";
import { getComponentById } from "~/models/component.server";

// lets get the component in the loader

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { componentId } = params;

  if (!componentId) {
    throw new Error("no component id");
  }

  const component = await getComponentById(componentId);

  return json({ component });
};

export default function Component() {
  const { component } = useLoaderData<typeof loader>();

  return (
    <>
      {component.type === "chat" ? (
        <Chat component={component.component as ChatInterface} />
      ) : (
        <Document component={component.component as DocumentInterface} />
      )}
    </>
  );
}
