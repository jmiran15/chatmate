import { AnonymousUser, Message } from "@prisma/client";
import * as E from "@react-email/components";
import { DateTime } from "luxon";
import { BaseEmailTemplate } from "./BaseEmailTemplate";
import { sharedStyles } from "./sharedStyles";

// Updated sample data
// const sampleAnonymousUser = {
//   id: "clhxz1234abcd",
//   createdAt: "2023-05-15T10:30:00Z",
//   ip: "192.168.1.1",
//   city: "New York",
//   country: "United States",
//   device_type: "Chrome on Mac OS X",
// };

// const sampleUserMessage = {
//   content: "Hi, I'm having trouble resetting my password. Can you help?",
//   timestamp: "2023-05-15T10:31:00Z",
// };

const userMessageStyles = {
  container: {
    backgroundColor: "#f2f3f3",
    padding: "24px",
    marginBottom: "24px",
    borderRadius: "4px",
  },
  heading: {
    fontSize: "22px",
    lineHeight: "1.3",
    fontWeight: "700",
    color: "#484848",
    marginBottom: "16px",
  },
  message: {
    fontSize: "18px",
    lineHeight: "1.4",
    color: "#484848",
  },
};

export default function ChatNotificationEmail({
  anonymousUser,
  userMessage,
  chatUrl,
}: {
  anonymousUser: AnonymousUser | null;
  userMessage: Message;
  chatUrl: string;
}) {
  return (
    <BaseEmailTemplate
      previewText="New customer support chat initiated"
      heading="New Chat Notification"
    >
      <E.Text style={sharedStyles.paragraph}>
        A new customer has initiated a chat on your website.
      </E.Text>

      <E.Section style={{ marginBottom: "24px" }}>
        <E.Text style={sharedStyles.paragraph}>
          <strong>Time: </strong>
          {DateTime.fromJSDate(
            userMessage?.createdAt || new Date(),
          ).toLocaleString(DateTime.DATETIME_FULL)}
        </E.Text>
        <E.Text style={{ ...sharedStyles.paragraph, marginTop: -5 }}>
          <strong>Device: </strong>
          {anonymousUser?.device_type || "Unknown"}
        </E.Text>
        <E.Text style={{ ...sharedStyles.paragraph, marginTop: -5 }}>
          <strong>Location: </strong>
          {anonymousUser?.city || "Unknown"},{" "}
          {anonymousUser?.country || "Unknown"}
        </E.Text>
        <E.Text
          style={{
            ...sharedStyles.paragraph,
            fontSize: "14px",
            color: "rgb(0,0,0, 0.5)",
            marginTop: -5,
          }}
        >
          *Approximate geographic location based on IP address:{" "}
          {anonymousUser?.ip || "Unknown"}
        </E.Text>
      </E.Section>

      <E.Section style={userMessageStyles.container}>
        <E.Text style={userMessageStyles.heading}>
          Here's what the customer wrote
        </E.Text>
        <E.Text style={userMessageStyles.message}>{userMessage.content}</E.Text>
      </E.Section>

      <E.Text style={sharedStyles.paragraph}>
        Quick response times are crucial for customer satisfaction.
      </E.Text>

      <E.Section style={sharedStyles.buttonContainer}>
        <E.Button style={sharedStyles.button} href={chatUrl}>
          View in Chatmate
        </E.Button>
      </E.Section>
    </BaseEmailTemplate>
  );
}
