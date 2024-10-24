// app/components/response-type-explanation.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

function ChatExample({
  messages,
}: {
  messages: { role: "user" | "bot"; content: string }[];
}) {
  return (
    <div className="mt-2 p-2 bg-muted rounded">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          } mb-2`}
        >
          <div
            className={`p-2 rounded-lg ${
              message.role === "user" ? "bg-blue-100" : "bg-green-100"
            } max-w-[80%]`}
          >
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResponseTypeExplanation() {
  return (
    <div className="max-w-xs" onMouseDown={(e) => e.preventDefault()}>
      <Tabs defaultValue="static" className="mt-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="static">Static</TabsTrigger>
          <TabsTrigger value="generative">Generative</TabsTrigger>
        </TabsList>
        <TabsContent value="static">
          <p className="text-sm text-muted-foreground">
            The chatbot will use the exact text you provide.
          </p>
          <ChatExample
            messages={[
              { role: "user", content: "What's your return policy?" },
              {
                role: "bot",
                content:
                  "Our return policy allows returns within 30 days of purchase with a valid receipt. Items must be unused and in original packaging.",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="generative">
          <p className="text-sm text-muted-foreground">
            The chatbot will use your answer as a basis to generate a response.
          </p>
          <ChatExample
            messages={[
              { role: "user", content: "Can you explain your return policy?" },
              {
                role: "bot",
                content:
                  "Certainly! I'd be happy to explain our return policy. We offer a 30-day return window for most items. Here's a quick overview:\n\n1. You have 30 days from the date of purchase to return an item.\n2. The item must be unused and in its original packaging.\n3. You'll need to provide a valid receipt or proof of purchase.\n4. Refunds are typically processed within 5-7 business days.\n\nIs there anything specific about the return policy you'd like to know more about?",
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
