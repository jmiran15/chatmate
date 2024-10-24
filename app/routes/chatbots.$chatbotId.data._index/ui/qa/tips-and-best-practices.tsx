// app/components/tips-and-best-practices.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export function TipsAndBestPractices() {
  return (
    <div className="max-w-md p-4">
      <h3 className="text-lg font-semibold mb-4">
        Tips for Creating Effective Q&As
      </h3>
      <Tabs defaultValue="questions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="answers">Answers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="mt-4">
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Be specific:</strong> Frame questions clearly and
              concisely.
              <p className="text-muted-foreground mt-1">
                Example: "What are your business hours?" instead of "When are
                you open?"
              </p>
            </li>
            <li>
              <strong>Use natural language:</strong> Write questions as users
              would ask them.
              <p className="text-muted-foreground mt-1">
                Example: "How do I reset my password?" rather than "Password
                reset procedure"
              </p>
            </li>
            <li>
              <strong>Cover variations:</strong> Include common phrasings of the
              same question.
              <p className="text-muted-foreground mt-1">
                Example: "Do you offer refunds?" and "What's your return
                policy?"
              </p>
            </li>
          </ul>
        </TabsContent>
        <TabsContent value="answers" className="mt-4">
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Be comprehensive:</strong> Provide detailed answers that
              cover all aspects of the question.
              <p className="text-muted-foreground mt-1">
                Include relevant information, steps, or examples when
                applicable.
              </p>
            </li>
            <li>
              <strong>Use clear language:</strong> Avoid jargon and explain
              complex terms.
              <p className="text-muted-foreground mt-1">
                Ensure your answer is understandable to a wide audience.
              </p>
            </li>
            <li>
              <strong>Structure your answer:</strong> Use paragraphs or bullet
              points for better readability.
              <p className="text-muted-foreground mt-1">
                Break down complex answers into digestible sections.
              </p>
            </li>
          </ul>
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Match Type:</strong>
              <ul className="ml-4 mt-1">
                <li>
                  <strong>Broad:</strong> For general topics with various
                  phrasings.
                </li>
                <li>
                  <strong>Exact:</strong> For specific information or unique
                  questions.
                </li>
              </ul>
            </li>
            <li>
              <strong>Response Type:</strong>
              <ul className="ml-4 mt-1">
                <li>
                  <strong>Static:</strong> For consistent, pre-approved answers.
                </li>
                <li>
                  <strong>Generative:</strong> For more flexible, context-aware
                  responses.
                </li>
              </ul>
            </li>
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
