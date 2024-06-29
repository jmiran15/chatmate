import Customizer from "~/routes/chatbots.$chatbotId.appearance/theme-customizer";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  UploadHandler,
  json,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { getChatbotById, updateChatbotById } from "~/models/chatbot.server";
import { useFetcher, useLoaderData } from "@remix-run/react";
import Preview from "~/routes/chatbots.$chatbotId.appearance/widget/preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useIsMediumScreen } from "~/hooks/use-is-medium-screen";
import { uploadImage } from "~/utils/cloudinary.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatbotId } = params;
  if (!chatbotId) {
    throw new Error("No chatbotId provided");
  }

  // can probably defer and cache (localforage this)
  const chatbot = await getChatbotById({ id: chatbotId });

  return json({ chatbot });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("No chatbotId provided");
  }

  const uploadHandler: UploadHandler = unstable_composeUploadHandlers(
    async ({ name, data }) => {
      if (name !== "originalLogoFile" && name !== "croppedLogoFile") {
        return undefined;
      }

      const uploadedImage = await uploadImage(data);
      return uploadedImage.secure_url;
    },
    unstable_createMemoryUploadHandler(),
  );

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler,
  );
  const intent = String(formData.get("intent"));

  switch (intent) {
    case "generalUpdate": {
      return json({
        chatbot: await updateChatbotById({
          id: chatbotId,
          ...(JSON.parse(String(formData.get("update"))) ?? {}),
        }),
      });
    }
    case "logoImageUpdate": {
      const originalLogoFilepath = formData.get("originalLogoFile")
        ? String(formData.get("originalLogoFile"))
        : undefined;
      const orig = originalLogoFilepath ? { originalLogoFilepath } : {};
      const croppedLogoFilepath = String(formData.get("croppedLogoFile"));
      const lastCrop = JSON.parse(String(formData.get("lastCrop")));

      console.log({ originalLogoFilepath, croppedLogoFilepath, lastCrop });

      if (!croppedLogoFilepath || !lastCrop) {
        throw new Error("Invalid image update");
      }

      return json({
        chatbot: await updateChatbotById({
          id: chatbotId,

          croppedLogoFilepath,
          lastCrop,
          ...orig,
        }),
      });
    }
    case "removeLogoImage": {
      return json({
        chatbot: await updateChatbotById({
          id: chatbotId,
          originalLogoFilepath: null,
          croppedLogoFilepath: null,
          lastCrop: null,
        }),
      });
    }
    default:
      throw new Error("Invalid intent");
  }
};

export default function Appearance() {
  const { chatbot } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isMedium = useIsMediumScreen();

  const optimisticChatbot = fetcher.formData
    ? {
        ...chatbot,
        ...(fetcher.formData.get("intent") === "generalUpdate"
          ? JSON.parse(String(fetcher.formData.get("update")))
          : fetcher.formData.get("intent") === "logoImageUpdate"
          ? {
              croppedLogoFilepath: String(
                fetcher.formData.get("optimisticPath"),
              ),
            }
          : fetcher.formData.get("intent") === "removeLogoImage"
          ? {
              originalLogoFilepath: null,
              croppedLogoFilepath: null,
              lastCrop: null,
            }
          : {}),
      }
    : chatbot;

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
              <Customizer fetcher={fetcher} chatbot={optimisticChatbot} />
            </TabsContent>
            <TabsContent value="preview" asChild>
              <div className="flex flex-col flex-1 w-full items-end justify-end p-[20px]">
                <Preview chatbot={optimisticChatbot} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="grid grid-cols-4 overflow-y-auto h-full">
          <Customizer fetcher={fetcher} chatbot={optimisticChatbot} />
          <div className="col-span-2 flex flex-col items-end justify-end p-[20px] h-full bg-muted/40">
            <Preview chatbot={optimisticChatbot} />
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
