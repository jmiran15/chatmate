import Customizer from "~/components/appearance/theme-customizer";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { getChatbotById, updateChatbotById } from "~/models/chatbot.server";
import { useLoaderData, useParams } from "@remix-run/react";
import { useState } from "react";

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

  return await updateChatbotById({
    id: chatbotId,
    color: formData.get("color") as string,
    bio: formData.get("bio") as string,
    publicName: formData.get("name") as string,
    starterQuestions: (formData.get("starter") as string).split("\n"),
    introMessages: (formData.get("intro") as string).split("\n"),
  });
};

export default function Appearance() {
  const data = useLoaderData<typeof loader>();
  const { chatbotId } = useParams();
  const [refresh, setRefresh] = useState(0);

  console.log("refresh", refresh);

  return (
    <div className="grid grid-cols-4 h-full">
      <Customizer
        setRefresh={setRefresh}
        name={data?.publicName}
        bio={data?.bio}
        introMessages={data?.introMessages}
        starterQuestions={data?.starterQuestions}
        color={data?.color}
      />

      {/* bug with refreshing */}
      <div className="col-span-2">
        <iframe
          key={refresh}
          src={`https://chatmate.fly.dev/${chatbotId}/widget`}
          width="100%"
          height="100%"
          allowFullScreen
          title="chatbot-prev"
        />
      </div>
    </div>
  );
}

export const handle = {
  breadcrumb: "appearance",
};
