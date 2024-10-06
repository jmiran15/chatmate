import { WidgetPosition } from "@prisma/client";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  UploadHandler,
  json,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useIsMediumScreen } from "~/hooks/use-is-medium-screen";
import { getChatbotById, updateChatbotById } from "~/models/chatbot.server";
import { useSidebarWidth } from "~/providers/sidebarWidth";
import { uploadImage } from "~/utils/cloudinary.server";
import Customizer from "../chatbots.$chatbotId.channels.widget.appearance/theme-customizer";
import Preview from "../chatbots.$chatbotId.channels.widget.appearance/widget/preview";

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
      const updateData = JSON.parse(String(formData.get("update"))) ?? {};

      // Ensure widgetPosition is correctly typed if it's present in the update
      if (updateData.widgetPosition) {
        updateData.widgetPosition = updateData.widgetPosition as WidgetPosition;
      }

      return json({
        chatbot: await updateChatbotById({
          id: chatbotId,
          ...updateData,
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
  const customizerRef = useRef<HTMLDivElement>(null);
  const [customizerWidth, setCustomizerWidth] = useState<number | null>(null);
  const { sidebarWidth } = useSidebarWidth();

  useEffect(() => {
    const updateWidth = () => {
      if (customizerRef.current) {
        setCustomizerWidth(customizerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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
              <Customizer
                ref={customizerRef}
                fetcher={fetcher}
                chatbot={optimisticChatbot}
              />
            </TabsContent>
            <TabsContent value="preview" asChild>
              <div className="flex flex-col flex-1 w-full items-end justify-end p-[20px] overflow-y-auto">
                <Preview
                  chatbot={optimisticChatbot}
                  customizerWidth={customizerWidth ?? 0}
                  sidebarWidth={sidebarWidth ?? 0}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="grid grid-cols-4 overflow-y-auto h-full w-full">
          <Customizer
            ref={customizerRef}
            fetcher={fetcher}
            chatbot={optimisticChatbot}
          />
          <div className="col-span-2 flex flex-col items-end justify-end h-full p-[20px]">
            <Preview
              chatbot={optimisticChatbot}
              customizerWidth={customizerWidth ?? 0}
              sidebarWidth={sidebarWidth ?? 0}
            />
          </div>
        </div>
      )}
    </>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/appearance`,
  breadcrumb: "Appearance",
};
