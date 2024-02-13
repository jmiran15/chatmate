import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { widgetChat } from "~/cookies.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const chatbotId = formData.get("chatbotId");

  return redirect(`/${chatbotId}/widget`, {
    headers: {
      "Set-Cookie": await widgetChat.serialize({
        chatId: undefined,
      }),
    },
  });
};
