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

  return await updateChatbotById({
    id: chatbotId,
    color: formData.get("color") as string,
    // bio: formData.get("bio") as string,
    publicName: formData.get("name") as string,
    // starterQuestions: (formData.get("starter") as string).split("\n"),
    introMessages: (formData.get("intro") as string).split("\n"),
  });
};

export default function Appearance() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 h-full overflow-y-auto">
      <Customizer
        name={data?.publicName}
        // bio={data?.bio}
        introMessages={data?.introMessages}
        // starterQuestions={data?.starterQuestions}
        color={data?.color}
      />

      {/* bug with refreshing */}
      <div className="md:col-span-2 flex flex-col items-center justify-center p-8">
        <Preview
          primaryColor={data?.color}
          publicName={data?.publicName}
          starterMessages={data?.introMessages}
        />
      </div>
    </div>
  );
}

export const handle = {
  breadcrumb: "appearance",
};
