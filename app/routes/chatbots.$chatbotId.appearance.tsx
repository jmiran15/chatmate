import Customizer from "~/components/appearance/theme-customizer";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { getChatbotById, updateChatbotById } from "~/models/chatbot.server";
import { useLoaderData } from "@remix-run/react";
import Preview from "~/components/widget/preview";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbotId = params.chatbotId as string;
  if (!chatbotId)
    return json({ message: "No chatbotId provided" }, { status: 400 });
  const chatbot = await getChatbotById({ id: chatbotId });

  return json(chatbot);
};
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const chatbotId = params.chatbotId as string;

  if (!chatbotId)
    return json({ message: "No chatbotId provided" }, { status: 400 });

  const themeColor = formData.get("color") as string;
  const publicName = formData.get("name") as string;
  const introMessages = (formData.get("intro") as string).split("\n");
  const openIcon = formData.get("icon") as string;
  const logoUrl = formData.get("url") as string;

  return await updateChatbotById({
    id: chatbotId,
    themeColor,
    publicName,
    introMessages,
    openIcon,
    logoUrl,
  });
};

export default function Appearance() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 overflow-y-auto h-full">
      <Customizer
        name={data?.publicName}
        url={data?.logoUrl}
        color={data?.themeColor}
        icon={data?.openIcon}
        introMessages={data?.introMessages}
      />

      <div className="lg:col-span-2 flex flex-col items-end justify-end p-[20px] h-full bg-slate-100">
        <Preview chatbot={data} />
      </div>
    </div>
  );
}

export const handle = {
  breadcrumb: "appearance",
};
