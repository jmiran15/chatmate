import { useSearchParams } from "@remix-run/react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface SuggestionTabsProps {
  status: string;
}

export function SuggestionTabs({ status }: SuggestionTabsProps) {
  const [, setSearchParams] = useSearchParams();

  const handleTabChange = (value: string) => {
    setSearchParams({ status: value });
  };

  return (
    <Tabs
      value={status}
      onValueChange={handleTabChange}
      className="w-full mb-4"
    >
      <TabsList>
        <TabsTrigger value="PENDING">Pending</TabsTrigger>
        <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
        <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
