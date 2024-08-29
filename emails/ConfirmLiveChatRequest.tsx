import * as E from "@react-email/components";

function ConfirmLiveChatRequest() {
  return (
    <E.Html lang="en" dir="ltr">
      <E.Container>
        <E.Heading as="h1">Live Chat Request Confirmed</E.Heading>

        <E.Text>Hello,</E.Text>

        <E.Text>
          We've successfully received your request for a live chat session. An
          agent will join the chat soon.
        </E.Text>

        <E.Text>
          You'll receive another email notification when an agent is ready to
          chat with you. That email will contain a link to join the chat.
        </E.Text>

        <E.Text>
          Thank you for your patience. We look forward to assisting you soon.
        </E.Text>
      </E.Container>
    </E.Html>
  );
}

export default ConfirmLiveChatRequest;
