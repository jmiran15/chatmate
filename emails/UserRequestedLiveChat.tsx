import * as E from "@react-email/components";
import { BaseEmailTemplate } from "./BaseEmailTemplate";
import { sharedStyles } from "./sharedStyles";

export default function UserRequestedLiveChat({
  userEmail,
  chatLink,
}: {
  userEmail?: string;
  chatLink: string;
}) {
  return (
    <BaseEmailTemplate
      previewText="New Chatmate live chat request"
      heading="New Live Chat Request"
    >
      <E.Text style={sharedStyles.paragraph}>
        A user has requested a live chat session on your website.
      </E.Text>

      {userEmail && (
        <E.Text style={sharedStyles.paragraph}>
          <strong>User's email:</strong> {userEmail}
        </E.Text>
      )}

      <E.Text style={sharedStyles.paragraph}>
        Please click the link below to join the chat:
      </E.Text>

      <E.Section style={sharedStyles.buttonContainer}>
        <E.Button style={sharedStyles.button} href={chatLink}>
          Join Chat
        </E.Button>
      </E.Section>

      <E.Text style={sharedStyles.paragraph}>
        Remember to respond promptly to provide the best user experience.
      </E.Text>
    </BaseEmailTemplate>
  );
}
