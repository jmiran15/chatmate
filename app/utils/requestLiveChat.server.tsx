import ConfirmLiveChatRequest from "emails/ConfirmLiveChatRequest";
import { z } from "zod";
import UserRequestedLiveChat from "../../emails/UserRequestedLiveChat";
import { sendEmail } from "./email.server";

const RequestLiveChatSchema = z.object({
  userEmail: z.string().email("Invalid email address"),
  agentEmail: z.string().email("Invalid email address"),
});

export async function requestLiveChat(
  input: z.infer<typeof RequestLiveChatSchema>,
) {
  const result = RequestLiveChatSchema.safeParse(input);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { userEmail, agentEmail } = result.data;

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

  // create a new message in the DB with type REQUEST_LIVE_CHAT

  const verificationEmail = await sendEmail({
    to: userEmail,
    subject: `Live chat request received`,
    react: <ConfirmLiveChatRequest />,
  });

  // send verification email to the user email
  //   const successEmail = await sendEmail({
  //     to: userEmail,
  //     contents:
  //       "Hi, we have successfully received your request for live chat. An agent will join the chat soon. You will be notified at this email when the agent joins",
  //   });

  //   if (successEmail instanceof Error) {
  //     return { error: "Failed to send success email" };
  //   }

  //   return { success: true };
}

// Notes:
/**
 * How will we deal with sending the user a follow-up email once an agent joins the chat?
 * Event should be triggered when agent clicks "join" in a chat
 * We need to check if the user had a request for live chat
 * - If so, we send them an email saying "Agent has joined the chat"
 *
 * We can add a new type of Messages
 * - called "ActivitySeparators"?
 * - used to save activity changes, such as agent joined, user requested live chat, etc...
 * - Can use this in the prompt so the LLM doesn't request a bunch of live chats,
 * - Something like "I have already requested a live chat, please wait for an agent to join"
 *
 * We notify them when the request gets "closed" - i.e there was a request activity and a joined activity
 */

// Add the "Agent has joined" message when the click the "Join"
// Add the agent left activity after X minutes/seconds of inactivity - for example - if the agent leaves the page to go check something, or navigates to another chat
// !!!We don't want to add a bunch of left/joined messages in the chat!!!
