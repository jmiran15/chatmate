import { createId } from "@paralleldrive/cuid2";
import { ActivityType, type Message } from "@prisma/client";
import ConfirmLiveChatRequest from "emails/ConfirmLiveChatRequest";
import { z } from "zod";
import { prisma } from "~/db.server";
import UserRequestedLiveChat from "../../emails/UserRequestedLiveChat";
import { sendEmail } from "./email.server";
import { getIO } from "./socketmanager.server";

const RequestLiveChatSchema = z.object({
  // userEmail: z.string().email("Invalid email address").optional(),
  userEmail: z.string().email("Invalid email address"),
  agentEmail: z.string().email("Invalid email address"),
  agentConnected: z.boolean(),
  chatId: z.string(),
});

const RequestLiveChatResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

type RequestLiveChatResult = z.infer<typeof RequestLiveChatResultSchema>;

// TODO - make the email required + update the prompts.
// TODO - work on the prompts so that they suggest the live chat option more naturally and when it doesnt know an answer.
export async function requestLiveChat(
  input: z.infer<typeof RequestLiveChatSchema>,
): Promise<RequestLiveChatResult> {
  const result = RequestLiveChatSchema.safeParse(input);

  // 0. First step should be to check all of the inputs are valid, and return an error message if any of them are invalid
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { userEmail, agentEmail, agentConnected, chatId } = result.data;

  // 1. Check if the agent is currently in the chat, via the socket - or pass in variable (isAgent)
  // if the agent is already currently in the chat, return error message saying something like "Unable to request live chat, agent is already in the chat"
  // if the agent is not currently in the chat, then we can proceed

  // if (agentConnected) {
  //   return {
  //     success: false,
  //     error: "Unable to request live chat, agent is already in the chat",
  //   };
  // }

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          where: {
            activity: ActivityType.REQUESTED_LIVE_CHAT,
            seenByAgent: false,
          },
          take: 10,
        },
      },
    });

    console.log("chat", chat);

    if (!chat) {
      return { success: false, error: "Chat not found" };
    }

    // 2. Check that there is not already a pending request for a live chat
    // how can we go about this?
    // Whenever a live chat is requested -> we are supposed to add a new message to the chat with type "REQUEST_LIVE_CHAT"
    // We can then check if there is a message with type "REQUEST_LIVE_CHAT" which has not been acknowledged by the agent (seenByAgent = false)
    // If the above is true, it should essentially be a pure conditon that there is still a pending request for a live chat
    // Therefore, return an error message saying something like "Unable to request live chat, there is already a pending request for a live chat, please wait for the previous request to be acknowledged"
    // if there is not, we can proceed
    if (chat.messages.length > 0) {
      return {
        success: false,
        error:
          "There is already a pending request for a live chat. Please wait for the previous request to be acknowledged.",
      };
    }

    // 3. We then need to notify the agent that a user has requested a live chat
    const requestEmail = await sendEmail({
      to: agentEmail,
      subject: `A user has requested live chat`,
      react: (
        <UserRequestedLiveChat
          userEmail={userEmail}
          chatLink={"https://example.com"}
        />
      ),
    });

    if (requestEmail instanceof Error) {
      return { success: false, error: "Failed to send request email to agent" };
    }

    // 4.  We then need to notify the user that their request for a live chat has been received, and we will notify them when the agent joins the chat
    const verificationEmail = await sendEmail({
      to: userEmail,
      subject: `Live chat request received`,
      react: <ConfirmLiveChatRequest />,
    });

    if (verificationEmail instanceof Error) {
      return {
        success: false,
        error: "Failed to send verification email to user",
      };
    }

    // 5. we can proceed to create a new message with type "REQUEST_LIVE_CHAT"
    const newMessage = {
      id: createId(),
      role: "user",
      content: "Live chat requested",
      activity: ActivityType.REQUESTED_LIVE_CHAT,
      chatId,
      seenByUser: true,
      seenByAgent: false,
      seenByUserAt: new Date(),
    } as Message;

    const createdRequestLiveChatMessage = await prisma.message.create({
      data: newMessage,
    });

    if (!createdRequestLiveChatMessage) {
      return {
        success: false,
        error: "Failed to create request live chat message",
      };
    }

    const io = getIO();
    if (io) {
      io.emit("new message", {
        chatId,
        message: createdRequestLiveChatMessage,
      });
    } else {
      console.warn("Socket.IO instance not initialized");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in requestLiveChat:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
