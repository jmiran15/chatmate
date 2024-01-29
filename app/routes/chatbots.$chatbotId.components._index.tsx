// list of components

// import { ActionFunctionArgs } from "@remix-run/node";
// import { Form } from "@remix-run/react";

// TODO - FOLLOW CHATMATE ORIGINAL UNTIL EVERYTHING WORKING, THEN OPTIMIZE THINGS BASED ON REMIX, ETC..., i.e. apply new things, caching, styling, typescript, modularize, etc...

// * instead of going to new page, will just create component and navigate to its page (for now)
// button to add a document / chat component, each goes to a new page for creating that component
// can click cancel on next page or save to actually create the component which will then be added to the list (and redirect back)

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         gap: 8,
//         width: "100%",
//       }}
//     >

//       {/* <>
//         {dependencyOrder.flat().map((component) => (
//           <ComponentCard key={component.id} component={component} />
//         ))}
//       </> */}
//     </div>
//   );
// }

import { Stack } from "@mantine/core";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import ComponentCard from "~/components/ComponentCard";
import "react-tiny-fab/dist/styles.css";

import {
  createChatComponent,
  createDocumentComponent,
  getChatComponents,
  getDocumentComponents,
} from "~/models/component.server";
import { ChatComponent, DocumentComponent } from "@prisma/client";

// import { USER_INPUT_UUID } from "~/utils/helpers";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const chatbotId = params.chatbotId;
  const type = await formData.get("type");

  if (!chatbotId) {
    throw new Error("no chatbot id");
  }

  if (!type) {
    throw new Error("no type");
  }

  switch (type) {
    case "CHAT": {
      const component = await createChatComponent({
        chatbotReferenceId: chatbotId,
      });
      return redirect(component.id);
    }
    case "DOCUMENT": {
      const component = await createDocumentComponent({
        chatbotReferenceId: chatbotId,
      });
      return redirect(component.id);
    }
    default:
      throw new Error("invalid type");
  }
};

// lets calculate the order here, not use state
// we can just "cache" it in indexDB in with clientLoader, instead of keeping it in state
export const loader = async ({ params }: ActionFunctionArgs) => {
  // first need to load all the components
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("no chatbot id");
  }

  const chatComponents = await getChatComponents({
    chatbotReferenceId: chatbotId,
  });

  const documentComponents = await getDocumentComponents({
    chatbotReferenceId: chatbotId,
  });

  const components = [...chatComponents, ...documentComponents];

  return json({ components });
};

export default function Components() {
  const { components } = useLoaderData<typeof loader>();

  return (
    <Stack w="100%">
      <Form method="post" className="space-y-6">
        <input type="hidden" name="type" value="CHAT" />

        <button
          type="submit"
          className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Create Chat Component
        </button>
      </Form>

      <Form method="post" className="space-y-6">
        <input type="hidden" name="type" value="DOCUMENT" />

        <button
          type="submit"
          className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Create Data Component
        </button>
      </Form>
      {components.map((component: ChatComponent | DocumentComponent) => (
        <ComponentCard key={component.id} component={component} />
      ))}
    </Stack>
  );
}
