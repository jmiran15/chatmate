import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { Separator } from "~/components/ui/separator";
import Container from "../chatbots.$chatbotId.forms._index/Container";
import Description from "../chatbots.$chatbotId.forms._index/Description";
import Title from "../chatbots.$chatbotId.forms._index/Title";
import { SuggestionCard } from "./suggestion-card";
import { SuggestionTabs } from "./suggestion-tabs";

interface Suggestion {
  id: string;
  query: string;
  createdAt: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
}

const dummySuggestions: Suggestion[] = [
  {
    id: "1",
    query: "How do I reset my password?",
    createdAt: "2023-04-10T12:00:00Z",
    status: "PENDING",
  },
  {
    id: "2",
    query: "What are your business hours?",
    createdAt: "2023-04-09T14:30:00Z",
    status: "RESOLVED",
  },
  {
    id: "3",
    query: "Do you offer international shipping?",
    createdAt: "2023-04-08T09:15:00Z",
    status: "DISMISSED",
  },
  // Add more dummy suggestions as needed
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "PENDING";

  const filteredSuggestions = dummySuggestions.filter(
    (suggestion) => suggestion.status === status,
  );

  return json({ suggestions: filteredSuggestions, status });
};

export default function SuggestionsPage() {
  const { suggestions, status } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <Container className="max-w-5xl">
      <Header />
      <Separator />
      <SuggestionTabs status={status} />
      <div className="space-y-4 overflow-y-auto flex-1 w-full">
        {suggestions.length === 0 ? (
          <div className="text-center text-gray-500">No suggestions found</div>
        ) : (
          suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))
        )}
      </div>
    </Container>
  );
}

function Header() {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between">
      <div className="flex flex-col">
        <Title>Suggestions</Title>
        <Description>
          Improve your chatbot by addressing unanswered queries. Review,
          resolve, or archive suggestions to enhance your chatbot's knowledge
          and performance.
        </Description>
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/suggestions`,
  breadcrumb: "suggestions",
};
