import * as E from "@react-email/components";
import { BaseEmailTemplate } from "./BaseEmailTemplate";
import { sharedStyles } from "./sharedStyles";

// const testUserId = "user_abc123";

export default function EmailChangeNoticeEmail({ userId }: { userId: string }) {
  return (
    <BaseEmailTemplate
      previewText="Your Chatmate email address has been changed"
      heading="Email Address Change Notification"
    >
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        We're writing to inform you that the email address associated with your
        Chatmate account has been successfully changed.
      </E.Text>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        If you initiated this change, no further action is required. You can
        continue to use Chatmate's AI-powered customer support platform as
        usual.
      </E.Text>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        However, if you did not request this email change, please take immediate
        action to secure your account:
      </E.Text>
      <E.Section style={sharedStyles.buttonContainer}>
        <E.Button
          style={sharedStyles.button}
          href="https://chatmate.so/contact-support"
          className="button"
        >
          Contact Support
        </E.Button>
      </E.Section>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        For security purposes, please reference the following Account ID when
        contacting our support team:
      </E.Text>
      <E.Section
        style={{ ...sharedStyles.codeContainer, textAlign: "center" as const }}
      >
        <code style={sharedStyles.code}>{userId}</code>
      </E.Section>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        At Chatmate, we take the security of your account seriously. We're
        dedicated to providing a secure and efficient AI-powered customer
        support solution for your business.
      </E.Text>
    </BaseEmailTemplate>
  );
}
