import Customizer from "~/components/appearance/theme-customizer";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { getChatbotById, updateChatbotById } from "~/models/chatbot.server";
import { useLoaderData } from "@remix-run/react";
import Preview from "~/components/widget/preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useIsMediumScreen } from "~/hooks/use-is-medium-screen";
import { useMobileScreen } from "~/utils/mobile";

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
  const starterQuestions = (formData.get("starter") as string).split("\n");
  const openIcon = formData.get("icon") as string;
  const logoUrl = formData.get("url") as string;

  return await updateChatbotById({
    id: chatbotId,
    themeColor,
    publicName,
    introMessages,
    starterQuestions,
    openIcon,
    logoUrl,
  });
};

export default function Appearance() {
  const data = useLoaderData<typeof loader>();
  const isMedium = useIsMediumScreen();
  const isMobile = useMobileScreen();

  return (
    <>
      {isMedium ? (
        <div className="flex flex-col overflow-hidden h-full w-full items-start justify-start">
          <Tabs
            defaultValue="edit"
            className="w-full h-full overflow-hidden flex flex-col items-start justify-start"
          >
            <TabsList className="m-4">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="w-full flex-1 overflow-y-auto">
              <Customizer
                name={data?.publicName}
                url={data?.logoUrl}
                color={data?.themeColor}
                icon={data?.openIcon}
                introMessages={data?.introMessages}
                starterQuestions={data?.starterQuestions}
              />
            </TabsContent>
            <TabsContent value="preview" asChild>
              <div className="flex flex-col flex-1 w-full items-end justify-end p-[20px]">
                <Preview chatbot={data} isMobile={isMobile} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="grid grid-cols-4 overflow-y-auto h-full">
          <Customizer
            name={data?.publicName}
            url={data?.logoUrl}
            color={data?.themeColor}
            icon={data?.openIcon}
            introMessages={data?.introMessages}
            starterQuestions={data?.starterQuestions}
          />
          <div className="col-span-2 flex flex-col items-end justify-end p-[20px] h-full bg-muted/40">
            <Preview chatbot={data} isMobile={isMobile} />
          </div>
        </div>
      )}
    </>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/appearance`,
  breadcrumb: "appearance",
};
