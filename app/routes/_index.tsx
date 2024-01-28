// this is the landing page
import { Stack, Text, Center, Title } from "@mantine/core";
import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

import { useOptionalUser } from "~/utils";

export const meta: MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  const user = useOptionalUser();
  return (
    <Center px={300} py={100}>
      <Stack align="flex-start">
        <Title order={1}>Create and discover new chatbots</Title>
        <Text size="lg" color="dimmed">
          With chatmate.dev you can combine multiple gpt4 chatbots with vector
          document retrievals to create complex multi-chain chatbots. You can
          share your chatbots and discover new ones from the community.
        </Text>
        {/* {user && (
          <Link
            to="/chatbots"
            className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-blue-700 shadow-sm hover:bg-blue-50 sm:px-8"
          >
            View Chatbots for {user.email}
          </Link>
        )} */}
      </Stack>
    </Center>
  );
}
