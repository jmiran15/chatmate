import * as E from "@react-email/components";
import { BaseEmailTemplate } from "./BaseEmailTemplate";
import { sharedStyles } from "./sharedStyles";

export default function AgentJoinedChat() {
  return (
    <BaseEmailTemplate
      previewText="Your live chat agent has joined"
      heading="Your Live Chat Agent Has Joined"
    >
      <E.Text style={sharedStyles.paragraph}>Hello,</E.Text>

      <E.Text style={sharedStyles.paragraph}>
        Great news! An agent has joined your live chat session and is ready to
        assist you.
      </E.Text>

      <E.Text style={sharedStyles.paragraph}>
        Please return to the chat window in your browser to begin your
        conversation.
      </E.Text>

      <E.Text style={sharedStyles.paragraph}>
        Thank you for your patience. We're looking forward to helping you!
      </E.Text>
    </BaseEmailTemplate>
  );
}
