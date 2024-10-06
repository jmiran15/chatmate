import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { prisma } from "~/db.server";
import Container from "../chatbots.$chatbotId.forms._index/Container";
import Description from "../chatbots.$chatbotId.forms._index/Description";
import Title from "../chatbots.$chatbotId.forms._index/Title";
import { FlowCard } from "./flow-card";

interface Flow {
  id: string;
  name: string;
  lastUpdated: string;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  const flows = await prisma.flow.findMany({
    where: {
      chatbotId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  });

  const formattedFlows: Flow[] = flows.map((flow) => ({
    id: flow.id,
    name: flow.name,
    lastUpdated: flow.updatedAt.toISOString(),
  }));

  return json({ flows: formattedFlows });
};

export default function FlowsPage() {
  const { flows } = useLoaderData<typeof loader>();

  return (
    <Container className="max-w-5xl">
      <Header />
      <Separator />
      <div className="space-y-4 overflow-y-auto flex-1 w-full">
        {flows.length === 0 ? (
          <div className="text-center text-gray-500">No flows found</div>
        ) : (
          flows.map((flow) => <FlowCard key={flow.id} flow={flow} />)
        )}
      </div>
    </Container>
  );
}

function Header() {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between">
      <div className="flex flex-col">
        <Title>My flows</Title>
        <Description>Manage your chatbot flows</Description>
      </div>
      <Button asChild>
        <Link to="new">
          <Plus className="mr-2 h-4 w-4" />{" "}
          <span className="text-md">Create a new flow</span>
        </Link>
      </Button>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/flows`,
  breadcrumb: "flows",
};
