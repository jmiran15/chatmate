import type { Trigger } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { CustomSelect } from "./select";
import { TriggerSchema } from "./types";

export default function Trigger({
  trigger,
  handleFormChange,
}: {
  trigger: SerializeFrom<Trigger>;
  handleFormChange: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [triggerType, setTriggerType] = useState<TriggerSchema["type"]>(
    trigger.type,
  );

  function toggleCard() {
    setIsOpen((prev) => !prev);
  }

  const triggerOptions = [
    { id: "INITIAL_LOAD", name: "On initial load" },
    { id: "CUSTOM_EVENT", name: "Custom trigger" },
  ];

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="cursor-pointer" onClick={toggleCard}>
        <CardTitle className="flex justify-between items-center">
          Trigger
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent className="flex flex-col gap-4">
          <CustomSelect
            name="triggerType"
            options={triggerOptions}
            value={triggerType}
            onChange={(value) => setTriggerType(value as TriggerSchema["type"])}
            placeholder="Select trigger type"
            handleFormChange={handleFormChange}
          />
          {triggerType === "CUSTOM_EVENT" && (
            <Textarea
              name="triggerDescription"
              placeholder="Enter a detailed description of when the chatbot should trigger this flow."
              defaultValue={trigger.description ?? ""}
            />
          )}
        </CardContent>
      )}
      {isOpen && (
        <CardFooter>
          <Button type="button" variant="ghost" onClick={() => toggleCard()}>
            Close
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
