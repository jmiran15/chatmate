import { arrayMove } from "@dnd-kit/sortable";
import { FormElement, InputType } from "@prisma/client";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
  SerializeFrom,
} from "@remix-run/node";
import { useFetchers, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prisma } from "~/db.server";
import Header from "./Header";
import FormPreview from "./Preview";
import RightBar from "./RightBar";
import FormStructure from "./Structure";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { formId } = params;

  if (!formId) {
    throw new Error("Form ID and Chatbot ID are required");
  }

  const form = await prisma.form.findUnique({
    where: {
      id: formId,
    },
    include: {
      submissions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      elements: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!form) {
    throw new Error("Form not found");
  }

  return json({
    form,
    clientTypes: InputType,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { chatbotId, formId } = params;
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (!chatbotId || !formId) {
    throw new Error("Chatbot ID and Form ID are required");
  }

  switch (intent) {
    case "reorder": {
      const oldIndex = Number(formData.get("oldIndex"));
      const newIndex = Number(formData.get("newIndex"));
      const elements = JSON.parse(
        formData.get("elements") as string,
      ) as FormElement[];
      console.log("parsedElements", elements);

      return await prisma.$transaction([
        prisma.formElement.update({
          where: { id: elements[oldIndex].id },
          data: { order: newIndex },
        }),
        prisma.formElement.update({
          where: { id: elements[newIndex].id },
          data: { order: oldIndex },
        }),
      ]);
    }
    case "update": {
      const element = JSON.parse(
        formData.get("partialElement") as string,
      ) as Partial<FormElement>;
      return await prisma.formElement.update({
        where: { id: element.id },
        data: {
          ...element,
        },
      });
    }
    case "create": {
      console.log("create");
      const element = JSON.parse(
        formData.get("element") as string,
      ) as FormElement;
      console.log("element", element);
      return await prisma.formElement.create({
        data: {
          ...element,
        },
      });
    }
    case "delete": {
      const elementId = formData.get("elementId") as string;
      return await prisma.formElement.delete({
        where: { id: elementId },
      });
    }

    case "deleteForm": {
      try {
        await prisma.form.delete({ where: { id: formId } });
        return redirect(`/chatbots/${chatbotId}/forms`);
      } catch (error) {
        console.error("Error deleting form:", error);
        throw new Error("Failed to delete form");
      }
    }

    default:
      throw new Error("Invalid intent");
  }
};

export const fetcherKeys = {
  reorder: "reorder",
  update: "update",
  create: "create",
  delete: "delete",
};

export default function FormBuilder() {
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [editingElement, setEditingElement] =
    useState<SerializeFrom<FormElement> | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const fetchers = useFetchers();
  const {
    form: { elements: loaderElements },
  } = useLoaderData<typeof loader>();

  const optimisticFormElements: SerializeFrom<FormElement[]> = useMemo(() => {
    let elements = [...loaderElements];

    fetchers
      .filter(
        (fetcher) =>
          Object.values(fetcherKeys).includes(fetcher.key) && fetcher.formData,
      )
      .forEach((fetcher) => {
        switch (fetcher.key) {
          case "reorder": {
            const oldIndex = Number(fetcher.formData?.get("oldIndex"));
            const newIndex = Number(fetcher.formData?.get("newIndex"));
            elements = arrayMove(elements, oldIndex, newIndex);
            break;
          }
          case "update": {
            const partialElement = JSON.parse(
              fetcher.formData?.get("partialElement") as string,
            ) as SerializeFrom<FormElement>;
            elements = elements.map((element) =>
              element.id === partialElement.id
                ? { ...element, ...partialElement }
                : element,
            );
            break;
          }
          case "create": {
            const newElement = JSON.parse(
              fetcher.formData?.get("element") as string,
            ) as SerializeFrom<FormElement>;
            elements = [...elements, newElement];
            break;
          }
          case "delete": {
            const elementId = fetcher.formData?.get("elementId");
            elements = elements.filter((element) => element.id !== elementId);
            break;
          }
        }
      });

    return elements.sort((a, b) => a.order - b.order);
  }, [loaderElements, fetchers]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <Header ref={headerRef} />
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Column - Structure */}
        <FormStructure
          optimisticFormElements={optimisticFormElements}
          setIsAddingBlock={setIsAddingBlock}
          setEditingElement={setEditingElement}
          editingElement={editingElement}
        />
        {/* Center Column - Preview */}
        <FormPreview
          isAddingBlock={isAddingBlock}
          optimisticFormElements={optimisticFormElements}
          editingElement={editingElement}
        />

        {/* Right Column - Edit */}
        <RightBar
          headerHeight={headerHeight}
          isAddingBlock={isAddingBlock}
          editingElement={editingElement}
          setIsAddingBlock={setIsAddingBlock}
          setEditingElement={setEditingElement}
        />
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/forms`,
  breadcrumb: "forms",
};
