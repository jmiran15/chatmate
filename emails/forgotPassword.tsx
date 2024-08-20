import * as E from "@react-email/components";
import { BaseEmailTemplate } from "./BaseEmailTemplate";
import { sharedStyles } from "./sharedStyles";

// const testOTP = "51CX7T";
// const testOnboardingUrl =
//   "https://chatmate.so/verify?type=change-email&target=f1c049a5-1ddc-4f3d-8e61-20e82ec9bd06&code=51CX7T";

export default function ForgotPasswordEmail({
  onboardingUrl,
  otp,
}: {
  onboardingUrl: string;
  otp: string;
}) {
  return (
    <BaseEmailTemplate
      previewText="Reset your Chatmate password"
      heading="Reset Your Chatmate Password"
    >
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        Hello,
      </E.Text>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        We received a request to reset your Chatmate password. Use the
        verification code below to complete the process:
      </E.Text>
      <E.Section style={sharedStyles.codeContainer}>
        <code style={sharedStyles.code}>{otp}</code>
      </E.Section>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        This code will only be valid for the next 10 minutes. Alternatively, you
        can click the button below to reset your password directly:
      </E.Text>
      <E.Section style={sharedStyles.buttonContainer}>
        <E.Button
          style={sharedStyles.button}
          href={onboardingUrl}
          className="button"
        >
          Reset Password
        </E.Button>
      </E.Section>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        If you didn't request a password reset, please ignore this email or
        contact support if you have concerns about your account's security.
      </E.Text>
    </BaseEmailTemplate>
  );
}
