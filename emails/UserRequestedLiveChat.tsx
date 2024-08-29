import * as E from "@react-email/components";

export default function UserRequestedLiveChat({
  userEmail,
  chatLink,
}: {
  userEmail?: string;
  chatLink: string;
}) {
  return (
    <E.Html lang="en" dir="ltr">
      <E.Container>
        <E.Heading as="h1">Live Chat Request</E.Heading>
        <E.Text>A user has requested a live chat session.</E.Text>

        {userEmail && (
          <E.Text>
            User's email: <strong>{userEmail}</strong>
          </E.Text>
        )}

        <E.Text>Please click the link below to join the chat:</E.Text>
        <E.Link href={chatLink}>{chatLink}</E.Link>

        <E.Text>
          Remember to respond promptly to provide the best user experience.
        </E.Text>
      </E.Container>
    </E.Html>
  );
}
