import Customizer from "~/components/appearance/theme-customizer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import DeadChat from "~/components/appearance/dead-chat";
import {
  getChatbotById,
  updateChatbotAppearanceById,
} from "~/models/chatbot.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbotId = params.chatbotId as string;
  if (!chatbotId)
    return json({ message: "No chatbotId provided" }, { status: 400 });
  const chatbot = await getChatbotById({ id: chatbotId });

  return json(chatbot);
};
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const field = formData.get("field") as string;
  const chatbotId = params.chatbotId as string;

  if (!field) return json({ message: "No field provided" }, { status: 400 });
  if (!chatbotId)
    return json({ message: "No chatbotId provided" }, { status: 400 });

  switch (field) {
    case "reset": {
      return await updateChatbotAppearanceById({
        id: chatbotId,
        theme: {
          introMessages: "Hello, how can I help you today?",
          starterQuestions: "What are your features?",
          color: "zinc",
          radius: "0.5",
        },
      });
    }
    case "intro": {
      const introMessages = formData.get("value") as string;
      return await updateChatbotAppearanceById({
        id: chatbotId,
        theme: {
          introMessages,
        },
      });
    }
    case "starter": {
      const starterQuestions = formData.get("value") as string;
      return await updateChatbotAppearanceById({
        id: chatbotId,
        theme: {
          starterQuestions,
        },
      });
    }
    case "color": {
      const color = formData.get("value") as string;
      return await updateChatbotAppearanceById({
        id: chatbotId,
        theme: {
          color,
        },
      });
    }
    case "radius": {
      const radius = parseFloat(formData.get("value") as string);
      return await updateChatbotAppearanceById({
        id: chatbotId,
        theme: {
          radius,
        },
      });
    }
    default: {
      return json({ message: "Invalid field" }, { status: 400 });
    }
  }
};

export default function Appearance({
  defaultLayout = [50, 50],
}: {
  defaultLayout?: number[] | undefined;
}) {
  const data = useLoaderData<typeof loader>();

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full max-h-[800px] items-stretch"
    >
      <ResizablePanel defaultSize={defaultLayout[0]} collapsible={false}>
        <Customizer
          introMessages={data?.introMessages}
          starterQuestions={data?.starterQuestions}
          color={data?.color}
          radius={data?.radius}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize={defaultLayout[1]}
        className="flex items-center justify-center"
      >
        <div className="h-full w-full flex items-center justify-center py-24">
          <DeadChat
            color={data?.color}
            radius={data?.radius}
            name={data?.name}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export const handle = {
  breadcrumb: "appearance",
};
