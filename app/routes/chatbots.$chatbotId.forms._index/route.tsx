import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { prisma } from "~/db.server";
import Container from "./Container";
import Description from "./Description";
import { FormCard } from "./form-card";
import Title from "./Title";

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
    <Container className="max-w-5xl">
      <Header />
      <Separator />
      <div className="flex flex-col gap-4 overflow-y-auto flex-1 w-full">
        {forms.length === 0 ? (
          <div className="text-center text-gray-500">No forms found</div>
        ) : (
          forms.map((form) => <FormCard key={form.id} form={form} />)
        )}
      </div>
    </Container>
  );
}

function Header() {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between">
      <div className="flex flex-col">
        <Title>My forms</Title>
        <Description>Manage your forms and submissions</Description>
      </div>
      <Button asChild>
        <Link to="new">
          <Plus className="mr-2 h-4 w-4" />{" "}
          <span className="text-md">Create a new form</span>
        </Link>
      </Button>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string, formId: string) => `/chatbots/${chatbotId}/forms`,
  breadcrumb: "forms",
  getSitemapEntries: () => null,
};
