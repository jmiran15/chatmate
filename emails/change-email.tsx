import * as E from "@react-email/components";
import { BaseEmailTemplate } from "./BaseEmailTemplate";
import { sharedStyles } from "./sharedStyles";

// const testOTP = "51CX7T";
// const testVerifyUrl =
//   "https://chatmate.so/verify?type=change-email&target=f1c049a5-1ddc-4f3d-8e61-20e82ec9bd06&code=51CX7T";

export default function EmailChangeEmail({
  verifyUrl,
  otp,
}: {
  verifyUrl: string;
  otp: string;
}) {
  return (
    <BaseEmailTemplate
      previewText="Verify your new Chatmate email address"
      heading="Verify Your New Email Address"
    >
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        We've received a request to change the email address associated with
        your Chatmate account. To ensure the security of your account, please
        verify this change using the code below:
      </E.Text>
      <E.Section style={sharedStyles.codeContainer}>
        <code style={sharedStyles.code}>{otp}</code>
      </E.Section>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        This code will only be valid for the next 10 minutes. Alternatively, you
        can click the button below to verify your new email address:
      </E.Text>
      <E.Section style={sharedStyles.buttonContainer}>
        <E.Button
          style={sharedStyles.button}
          href={verifyUrl}
          className="button"
        >
          Verify New Email
        </E.Button>
      </E.Section>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        If you didn't request this email change, please contact our support team
        immediately to secure your account.
      </E.Text>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        Thank you for helping us keep your Chatmate account secure. We're
        committed to providing you with the best AI-powered customer support
        platform.
      </E.Text>
    </BaseEmailTemplate>
  );
}
