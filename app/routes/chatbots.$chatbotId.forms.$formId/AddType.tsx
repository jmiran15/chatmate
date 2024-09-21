import { createId } from "@paralleldrive/cuid2";
import type { FormElement, InputType } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { FIELD_TYPES, loader } from "./route";

export default function AddType({
  setIsAddingBlock,
  setEditingElement,
}: {
  setIsAddingBlock: (isAddingBlock: boolean) => void;
  setEditingElement: (element: SerializeFrom<FormElement> | null) => void;
}) {
  const { form, clientTypes } = useLoaderData<typeof loader>();
  const createFetcher = useFetcher({ key: "create" });
  const elementsLength = form.elements.length;
  const addFormElement = (type: InputType) => {
    const newElement: SerializeFrom<FormElement> = {
      id: createId(),
      type,
      name: `field_${Date.now()}`,
      label: `New ${FIELD_TYPES[type]} input`,
      required: false,
      placeholder: `Enter ${FIELD_TYPES[type]}`,
      order: elementsLength,
      options: type === clientTypes.SELECT ? ["Option 1", "Option 2"] : [],
      min: null,
      max: null,
      step: null,
      min_error: null,
      max_error: null,
      invalid_type_error: null,
      description: null,
      formId: form.id,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      required_error: null,
    };

    setIsAddingBlock(false);
    setEditingElement(newElement);

    // submit fetcher "create"
    createFetcher.submit(
      { element: JSON.stringify(newElement), intent: "create" },
      { method: "POST" },
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 overflow-y-auto">
      {Object.values(clientTypes).map((type: InputType) => (
        <Button
          key={type}
          onClick={() => addFormElement(type)}
          className="text-sm py-1 px-2 h-auto"
        >
          {FIELD_TYPES[type]}
        </Button>
      ))}
    </div>
  );
}
