import { z } from "zod";
import {
  actionSchema,
  ActionSchema,
  FlowSchema,
  triggerSchema,
  TriggerSchema,
} from "./types";

import type { Action, Form, FormElement } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";

export function formDataToFlowSchema(formData: FormData): Partial<FlowSchema> {
  const flowData: Partial<FlowSchema> = {
    trigger: {
      id: formData.get("triggerId") as string,
      type:
        (formData.get("triggerType") as TriggerSchema["type"]) ??
        "INITIAL_LOAD",
      description:
        (formData.get("triggerDescription") as string | undefined) ?? "",
    },
    actions: [],
  };

  // Collect all action-related entries
  const actionEntries = Array.from(formData.entries()).filter(
    ([key]) =>
      key.includes("-type") ||
      key.includes("-text") ||
      key.includes("-formId") ||
      key.includes("-delay") ||
      key.includes("-order") ||
      key.includes("-mentions"),
  );

  // Group action entries by their ID
  const groups = actionEntries.reduce(
    (groups: Record<string, Partial<ActionSchema>>, [key, value]) => {
      const [id, field] = key.split("-");
      if (!groups[id]) groups[id] = { id };
      if (field === "mentions") {
        groups[id].mentions = JSON.parse(value as string);
      } else {
        Object.assign(groups[id], { [field]: value });
      }
      return groups;
    },
    {} as Record<string, Partial<ActionSchema>>,
  );

  // Convert grouped actions to ActionSchema objects
  flowData.actions = Object.values(groups).map((group) => ({
    id: group.id,
    type: group.type as ActionSchema["type"],
    ...(group.type === "FORM"
      ? { formId: group.formId }
      : { text: group.text }),
    delay: group.delay ? Number(group.delay) : undefined,
    order: group.order ? Number(group.order) : undefined,
    mentions: group.mentions || [],
  }));

  // Validate the constructed flowData
  const validatedTrigger = triggerSchema.parse(flowData.trigger);
  const validatedActions = z.array(actionSchema).parse(flowData.actions);

  return {
    trigger: validatedTrigger,
    actions: validatedActions,
  };
}

export function getAvailableFormElementNames(
  previousActions: Partial<SerializeFrom<Action>>[],
  forms: SerializeFrom<Form & { elements: FormElement[] }>[],
): { id: string; display: string }[] {
  const availableForms = previousActions
    .filter((action) => action.type === "FORM" && action.formId)
    .map((action) => forms.find((form) => form.id === action.formId))
    .filter(
      (form): form is SerializeFrom<Form & { elements: FormElement[] }> =>
        form !== undefined,
    );

  return availableForms.flatMap((form) =>
    form.elements.map((el) => ({
      id: el.id,
      display: el.name,
    })),
  );
}
