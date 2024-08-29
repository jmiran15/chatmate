// send the user an email when the agent joins the live chat - if they provided an email
import * as E from "@react-email/components";

function AgentJoinedChat() {
  return (
    <E.Html lang="en" dir="ltr">
      <E.Container>
        <E.Heading as="h1">Your Live Chat Agent Has Joined</E.Heading>

        <E.Text>Hello,</E.Text>

        <E.Text>
          Great news! An agent has joined your live chat session and is ready to
          assist you.
        </E.Text>

        <E.Text>
          Please return to the chat window in your browser to begin your
          conversation.
        </E.Text>

        <E.Text>
          If you've closed the chat window, don't worry. You can access it again
          by logging into your account and navigating to the support section.
        </E.Text>

        <E.Text>
          Thank you for your patience. We're looking forward to helping you!
        </E.Text>
      </E.Container>
    </E.Html>
  );
}

export default AgentJoinedChat;
