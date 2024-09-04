import * as E from "@react-email/components";
import { BaseEmailTemplate } from "./BaseEmailTemplate";
import { sharedStyles } from "./sharedStyles";

export default function ConfirmLiveChatRequest() {
  return (
    <BaseEmailTemplate
      previewText="Your Chatmate live chat request has been confirmed"
      heading="Live Chat Request Confirmed"
    >
      <E.Text style={sharedStyles.paragraph}>Hello,</E.Text>

      <E.Text style={sharedStyles.paragraph}>
        We've successfully received your request for a live chat session. An
        agent will join the chat soon.
      </E.Text>

      <E.Text style={sharedStyles.paragraph}>
        You'll receive another email notification when an agent is ready to chat
        with you.
      </E.Text>

      <E.Text style={sharedStyles.paragraph}>
        Thank you for your patience. We look forward to assisting you soon.
      </E.Text>
    </BaseEmailTemplate>
  );
}
