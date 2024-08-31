import { type Prisma, type TicketStatus } from "@prisma/client";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";
import {
  connectLabel,
  createLabel,
  deleteChat,
  deleteLabel,
  disconnectLabel,
  markChatAsSeen,
  updateChatStatus,
  updateLabel,
} from "./queries.server";

const getStarred = (searchParams: URLSearchParams): "1" | "0" =>
  String(searchParams.get("starred")) === "1" ? "1" : "0";

const getCreatedAt = (searchParams: URLSearchParams): "asc" | "desc" =>
  String(searchParams.get("createdAt")) === "asc" ? "asc" : "desc";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get("intent"));
  const { chatbotId, chatsId } = params;
  const { searchParams } = new URL(request.url);

  if (!chatbotId) {
    throw new Error("Chatbot id missing");
  }

  if (!chatsId) {
    throw new Error("Chat id missing");
  }

  switch (intent) {
    case "archive-chat-thread": {
      const chatId = String(formData.get("chatId"));

      const starred = getStarred(searchParams);
      const createdAt = getCreatedAt(searchParams);
      const starredQuery = starred === "1" ? { starred: true } : {};
      const createdAtQuery = {
        createdAt: (createdAt === "asc" ? "asc" : "desc") as Prisma.SortOrder,
      };

      const nextChatId = await deleteChat!({
        chatId,
        chatbotId,
        starredQuery,
        createdAtQuery,
      });

      if (nextChatId) {
        return redirect(
          `/chatbots/${chatbotId}/chats/${nextChatId}?${searchParams.toString()}`,
        );
      } else {
        return redirect(
          `/chatbots/${chatbotId}/chats?${searchParams.toString()}`,
        );
      }
    }
    case "mark-seen": {
      const chatId = String(formData.get("chatId"));
      return await markChatAsSeen!({ chatId });
    }
    case "create-label": {
      const name = String(formData.get("label-name"));
      const label = await createLabel!({ name, chatbotId });
      return json({ label });
    }
    case "update-label": {
      const labelId = String(formData.get("label-id"));
      const name = String(formData.get("label-name"));
      const color = String(formData.get("label-color"));
      const label = await updateLabel!({ labelId, name, color });
      return json({ label });
    }
    case "delete-label": {
      const labelId = String(formData.get("label-id"));
      const label = await deleteLabel!({ labelId });
      return json({ label });
    }
    case "connect-label": {
      const labelId = String(formData.get("label-id"));
      const chat = await connectLabel!({ chatId: chatsId, labelId });
      return json({ chat });
    }
    case "disconnect-label": {
      const labelId = String(formData.get("label-id"));
      const chat = await disconnectLabel!({ chatId: chatsId, labelId });
      return json({ chat });
    }
    case "update-status": {
      const status = String(formData.get("status")) as TicketStatus;
      const chat = await updateChatStatus!({ chatId: chatsId, status });
      return json({ chat });
    }
    case "mark-user-messages-seen": {
      const id = String(formData.get("messageId"));

      try {
        await prisma.message.update({
          where: {
            id,
            role: "user",
            chatId: chatsId,
            seenByAgent: false,
          },
          data: {
            seenByAgent: true,
          },
        });
      } catch (error) {
        console.error("Failed to mark message as seen:", error);
      }
      return json({ success: true });
    }
    case "createMessage": {
      const message = JSON.parse(String(formData.get("message")));

      const createdMessage = await prisma.message.create({
        data: {
          ...message,
        },
      });

      return json({
        messageCreatedSuccessfully: true,
        message: createdMessage,
      });
    }
    default:
      throw new Error("undefined intent");
  }
};
