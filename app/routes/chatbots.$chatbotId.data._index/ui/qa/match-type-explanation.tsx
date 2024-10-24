// app/components/match-type-explanation.tsx
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

function MatchExample({
  question,
  userQuery,
  matches,
}: {
  question: string;
  userQuery: string;
  matches: boolean;
}) {
  const Icon = matches ? CheckCircledIcon : CrossCircledIcon;
  return (
    <div
      className={`mt-2 p-2 rounded ${matches ? "bg-green-100" : "bg-red-100"}`}
    >
      <p className="text-sm font-medium">Q: {question}</p>
      <p className="text-sm">User: {userQuery}</p>
      <p className="text-sm flex items-center gap-1 mt-1">
        <Icon
          className={`h-4 w-4 ${matches ? "text-green-600" : "text-red-600"}`}
        />
        {matches ? "Matches" : "Doesn't match"}
      </p>
    </div>
  );
}

export function MatchTypeExplanation() {
  return (
    <div className="max-w-xs">
      <div className="mb-4">
        <h4 className="font-semibold">Broad Match</h4>
        <p className="text-sm text-muted-foreground">
          Matches similar questions. Use for general topics.
        </p>
        <MatchExample
          question="What's your pricing?"
          userQuery="Tell me about your costs."
          matches={true}
        />
      </div>
      <div>
        <h4 className="font-semibold">Exact Match</h4>
        <p className="text-sm text-muted-foreground">
          Matches only very similar phrasings. Use for specific information.
        </p>
        <MatchExample
          question="What's your refund policy?"
          userQuery="Do you offer refunds?"
          matches={false}
        />
      </div>
    </div>
  );
}
