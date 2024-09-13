import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { prisma } from "~/db.server";
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
    <div className="container mx-auto px-4 py-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My flows</h1>
          <p className="text-gray-600">Manage your chatbot flows</p>
        </div>
        <Button className="mt-4 sm:mt-0" asChild>
          <Link to="new">
            <Plus className="mr-2 h-4 w-4" /> Create a new flow
          </Link>
        </Button>
      </div>
      <div className="space-y-4 overflow-y-auto flex-1 w-full">
        {flows.length === 0 ? (
          <div className="text-center text-gray-500">No flows found</div>
        ) : (
          flows.map((flow) => <FlowCard key={flow.id} flow={flow} />)
        )}
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/flows`,
  breadcrumb: "flows",
};
