import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { prisma } from "~/db.server";
import { FormCard } from "./form-card";

interface Form {
  id: string;
  name: string;
  lastUpdated: string;
  submissionCount: number;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  const forms = await prisma.form.findMany({
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
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  const formattedForms: Form[] = forms.map((form) => ({
    id: form.id,
    name: form.name,
    lastUpdated: form.updatedAt.toISOString(),
    submissionCount: form._count.submissions,
  }));

  return json({ forms: formattedForms });
};

export default function FormsPage() {
  const { forms } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-8 h-full  flex flex-col">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My forms</h1>
          <p className="text-gray-600">Manage your forms and submissions</p>
        </div>
        <Button className="mt-4 sm:mt-0" asChild>
          <Link to="new">
            <Plus className="mr-2 h-4 w-4" /> Create a new form
          </Link>
        </Button>
      </div>
      <div className="space-y-4 overflow-y-auto flex-1 w-full">
        {forms.length === 0 ? (
          <div className="text-center text-gray-500">No forms found</div>
        ) : (
          forms.map((form) => <FormCard key={form.id} form={form} />)
        )}
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string, formId: string) => `/chatbots/${chatbotId}/forms`,
  breadcrumb: "forms",
  getSitemapEntries: () => null,
};
