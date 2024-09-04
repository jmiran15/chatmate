import { ActivityType, type Prisma, type TicketStatus } from "@prisma/client";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import AgentJoinedChat from "emails/AgentJoined";
import { prisma } from "~/db.server";
import { sendEmail } from "~/utils/email.server";
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
      let message;
      try {
        message = JSON.parse(String(formData.get("message")));
      } catch (error) {
        console.error("Failed to parse message JSON:", error);
        return json({ error: "Invalid message format" }, { status: 400 });
      }

      const createdMessage = await prisma.message.create({
        data: {
          ...message,
        },
      });

      return json({
        messageCreatedSuccessfully: true,
        message: createdMessage,
        dontRevalidate: true,
      });
    }
    case "notifyUserAgentJoined": {
      const chatId = String(formData.get("chatId"));

      console.log("NOTIFYING USER AGENT JOINED");
      const chat = await prisma.chat.findUnique({
        where: {
          id: chatId,
        },
        include: {
          messages: {
            select: {
              activity: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
      console.log("CHAT", chat);

      const requestedLiveChatMessage =
        chat?.messages.findIndex(
          (message) => message.activity === ActivityType.REQUESTED_LIVE_CHAT,
        ) ?? -1;

      const agentJoinedAfterLiveChatRequested =
        requestedLiveChatMessage !== -1
          ? chat?.messages.findIndex(
              (message, index) =>
                message.activity === ActivityType.AGENT_JOINED &&
                index < requestedLiveChatMessage,
            )
          : -1;

      // find the anon user
      const anonUser = chat?.sessionId
        ? await prisma.anonymousUser.findUnique({
            where: {
              sessionId: chat.sessionId,
            },
          })
        : null;

      console.log("ANON USER", anonUser);
      console.log(
        "AGENT JOINED AFTER LIVE CHAT REQUESTED",
        agentJoinedAfterLiveChatRequested,
      );

      if (agentJoinedAfterLiveChatRequested === -1 && anonUser?.email) {
        const response = await sendEmail({
          to: anonUser.email,
          subject: `Agent has joined the chat`,
          react: <AgentJoinedChat />,
        });

        if (response.status === "success") {
          return json({ success: true });
        } else {
          return json(
            {
              error: response.error.message,
            },
            { status: 500 },
          );
        }
      } else {
        return null;
      }
    }
    default:
      throw new Error("undefined intent");
  }
};
