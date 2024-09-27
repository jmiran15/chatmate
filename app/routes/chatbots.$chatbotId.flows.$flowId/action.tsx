import type { Action, Form } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { MentionInput } from "./MentionInput/mention-input";
import { CustomSelect } from "./select";
import { ActionSchema } from "./types";

export default function Action({
  action,
  index,
  forms,
  availableFormElementNames,
  onDelete,
  handleFormChange,
  isNewlyAdded,
}: {
  action: SerializeFrom<Action>;
  index: number;
  forms: SerializeFrom<Form>[];
  availableFormElementNames: { id: string; display: string }[];
  onDelete: (actionId: string) => void;
  handleFormChange: () => void;
  isNewlyAdded: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [actionType, setActionType] = useState<ActionSchema["type"]>(
    action.type,
  );
  const [formId, setFormId] = useState<string>(action.formId ?? "");
  const actionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNewlyAdded && actionRef.current) {
      actionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isNewlyAdded]);

  function toggleCard() {
    setIsOpen((prev) => !prev);
  }

  const formOptions = forms.map((form) => ({
    id: form.id,
    name: form.name,
  }));

  const handleTextChange = (newValue: string) => {
    handleFormChange();
  };

  return (
    <Card className="w-full max-w-4xl" ref={actionRef}>
      <CardHeader className="cursor-pointer" onClick={toggleCard}>
        <CardTitle className="flex justify-between items-center">
          <span>Action {action.order}</span>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </CardTitle>
      </CardHeader>
      <input
        type="hidden"
        name={`${action.id}-order`}
        value={action.order ?? ""}
      />
      {isOpen && (
        <CardContent className="flex flex-col gap-4">
          <CustomSelect
            name={`${action.id}-type`}
            options={[
              { id: "FORM", name: "Form" },
              { id: "TEXT", name: "Text" },
            ]}
            value={actionType}
            onChange={(value) => setActionType(value as ActionSchema["type"])}
            placeholder="Select action type"
            handleFormChange={handleFormChange}
          />
          {actionType === "FORM" && (
            <CustomSelect
              name={`${action.id}-formId`}
              options={formOptions}
              value={formId}
              onChange={(value) => setFormId(value)}
              placeholder="Select a form"
              handleFormChange={handleFormChange}
            />
          )}
          {actionType === "TEXT" && (
            <MentionInput
              name={action.id}
              defaultValue={action.text ?? ""}
              onChange={handleTextChange}
              suggestions={availableFormElementNames}
            />
          )}
          <Input
            type="number"
            name={`${action.id}-delay`}
            placeholder="Enter delay"
            defaultValue={action.delay ?? ""}
          />
        </CardContent>
      )}
      {isOpen && (
        <CardFooter className="flex justify-between">
          <Button type="button" variant="ghost" onClick={toggleCard}>
            Close
          </Button>
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(action.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
