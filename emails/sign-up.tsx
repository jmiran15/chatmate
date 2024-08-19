import * as E from "@react-email/components";
import { BaseEmailTemplate } from "./BaseEmailTemplate";
import { sharedStyles } from "./sharedStyles";

// const testOTP = "51CX7T";
// const testOnboardingUrl =
//   "https://chatmate.so/verify?type=change-email&target=f1c049a5-1ddc-4f3d-8e61-20e82ec9bd06&code=51CX7T";

export default function SignupEmail({
  onboardingUrl,
  otp,
}: {
  onboardingUrl: string;
  otp: string;
}) {
  return (
    <BaseEmailTemplate
      previewText="Welcome to Chatmate - Verify your email"
      heading="Welcome to Chatmate!"
    >
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        Thank you for signing up with Chatmate. We're excited to have you on
        board!
      </E.Text>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        To get started, please verify your email address using the verification
        code below:
      </E.Text>
      <E.Section style={sharedStyles.codeContainer}>
        <code style={sharedStyles.code}>{otp}</code>
      </E.Section>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        This code will only be valid for the next 10 minutes. Alternatively, you
        can click the button below to verify your email and start using
        Chatmate:
      </E.Text>
      <E.Section style={sharedStyles.buttonContainer}>
        <E.Button
          style={sharedStyles.button}
          href={onboardingUrl}
          className="button"
        >
          Verify Email & Get Started
        </E.Button>
      </E.Section>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        If you didn't sign up for a Chatmate account, please ignore this email.
      </E.Text>
      <E.Text style={sharedStyles.paragraph} className="paragraph">
        We're looking forward to helping you create amazing chatbots for your
        website!
      </E.Text>
    </BaseEmailTemplate>
  );
}
