import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { jsonSchemaToZod } from "json-schema-to-zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormSubmission, Prisma } from "@prisma/client";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { ArrowLeft, GripVertical, Plus, Trash2, X } from "lucide-react";
import { DateTime } from "luxon";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import AutoForm, { AutoFormSubmit } from "~/components/ui/auto-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { prisma } from "~/db.server";
import { cn } from "~/lib/utils";
import {
  FormElement,
  FormSchema,
  InputType,
  inputTypes,
} from "../chatbots.$chatbotId.forms.new/types";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  // load in the form from the database
  const { formId, chatbotId } = params;

  if (!formId || !chatbotId) {
    throw new Error("Form ID and Chatbot ID are required");
  }

  const form = await prisma.form.findUnique({
    where: {
      id: formId,
      chatbotId,
    },
    select: {
      id: true,
      name: true,
      formSchema: true,
      schemaVersion: true,
      submissions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!form) {
    throw new Error("Form not found");
  }

  let formSchema: Prisma.JsonObject | null = null;
  if (form?.formSchema && typeof form?.formSchema === "object") {
    formSchema = form?.formSchema as Prisma.JsonObject;
  }

  if (!formSchema) {
    throw new Error("Form schema not found");
  }
  console.log("formSchema", JSON.stringify(formSchema, null, 2));

  return json({
    form: { ...form, chatbotId },
    formSchema: form.formSchema as {
      schema: { definitions: { formSchema: any } };
      fieldConfig: Record<string, any>;
    },
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { chatbotId, formId } = params;
  const formData = await request.formData();
  const action = formData.get("_action");

  if (!chatbotId || !formId) {
    throw new Error("Chatbot ID and Form ID are required");
  }

  if (action === "save") {
    const formSchemaJson = formData.get("formSchema");
    const formSchema = formSchemaJson
      ? JSON.parse(formSchemaJson as string)
      : null;

    if (!formSchema) {
      return json({ error: "Invalid form schema" }, { status: 400 });
    }

    console.log("formSchema", formSchema);

    try {
      const updatedForm = await prisma.form.update({
        where: { id: formId },
        data: {
          formSchema,
          schemaVersion: { increment: 1 }, // Increment the version to force an update
        },
      });

      console.log("updatedForm", {
        formSchema,
        updatedForm: updatedForm.formSchema,
      });
      return json({ success: true });
    } catch (error) {
      console.error("Error saving form:", error);
      return json({ error: "Failed to save form" }, { status: 500 });
    }
  } else if (action === "delete") {
    try {
      await prisma.form.delete({ where: { id: formId } });
      return redirect(`/chatbots/${chatbotId}/forms`);
    } catch (error) {
      console.error("Error deleting form:", error);
      return json({ error: "Failed to delete form" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function FormBuilder() {
  const { form, formSchema: initialFormSchema } =
    useLoaderData<typeof loader>();
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [formSchema, setFormSchema] = useState<FormSchema>({
    schema: z.object({}),
    fieldConfig: {},
  });
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [editingElement, setEditingElement] = useState<FormElement | null>(
    null,
  );
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isElementDeleteDialogOpen, setIsElementDeleteDialogOpen] =
    useState(false);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);

  const fetcher = useFetcher();
  const { toast } = useToast();

  const convertSchemaToElements = useCallback(
    (
      schema: z.ZodObject<any>,
      fieldConfig: Record<string, any>,
    ): FormElement[] => {
      console.log("schema", schema);

      function getBaseSchema<
        ChildType extends z.ZodAny | z.AnyZodObject = z.ZodAny,
      >(schema: ChildType | z.ZodEffects<ChildType>): ChildType | null {
        if (!schema) return null;
        if ("innerType" in schema._def) {
          return getBaseSchema(schema._def.innerType as ChildType);
        }
        if ("schema" in schema._def) {
          return getBaseSchema(schema._def.schema as ChildType);
        }

        return schema as ChildType;
      }

      function getBaseType(schema: z.ZodAny): string {
        const baseSchema = getBaseSchema(schema);
        return baseSchema ? baseSchema._def.typeName : "";
      }

      return Object.keys(schema.shape).map((name, index) => {
        console.log(
          "name and field: ",
          name,
          schema.shape[name]._def.innerType,
          getBaseType(schema.shape[name]),
        );
        const baseSchema = getBaseSchema(schema.shape[name]);

        // const field = schema.shape[name];
        const config = fieldConfig[name] || {};
        const type =
          baseSchema instanceof z.ZodString
            ? "text"
            : baseSchema instanceof z.ZodNumber
            ? "number"
            : baseSchema instanceof z.ZodBoolean
            ? "checkbox"
            : baseSchema instanceof z.ZodEnum
            ? "select"
            : "text";

        return {
          id: name,
          type: type as InputType,
          name,
          label: (baseSchema as any).description || name,
          required: !(baseSchema as any).isOptional(),
          placeholder: config.inputProps?.placeholder || "",
          description: config.description || "",
          options:
            type === "select" ? (baseSchema as any)._def.values : undefined,
          min: type === "number" ? config.inputProps?.min : undefined,
          max: type === "number" ? config.inputProps?.max : undefined,
          step: type === "number" ? config.inputProps?.step : undefined,
          order: config.order || index, // Use stored order or fallback to index
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (
      initialFormSchema &&
      typeof initialFormSchema === "object" &&
      "schema" in initialFormSchema
    ) {
      const schema = initialFormSchema.schema;

      if (schema && typeof schema === "object" && "definitions" in schema) {
        const jsonSchema = schema.definitions?.formSchema;
        if (
          jsonSchema &&
          typeof jsonSchema === "object" &&
          "properties" in jsonSchema
        ) {
          // Remove order from JSON schema before converting to Zod
          const schemaWithoutOrder = {
            ...jsonSchema,
            properties: Object.fromEntries(
              Object.entries(jsonSchema.properties).map(([key, value]) => [
                key,
                { ...(value as object), order: undefined },
              ]),
            ),
          };

          const zodSchemaString = jsonSchemaToZod(schemaWithoutOrder);
          console.log("zodSchemaFromJson", jsonSchema, zodSchemaString);

          const schemaString = `
  // you can put any helper function or code directly inside the string and use them in your schema
  
  function getZodSchema({z, ctx}) {
    // use ctx for any dynamic data that your schema depends on
    return ${zodSchemaString};
  }
  `;

          const zodSchema = Function(
            "...args",
            `${schemaString}; return getZodSchema(...args)`,
          )({ z, ctx: {} });

          const newFormSchema = {
            schema: zodSchema,
            fieldConfig:
              (initialFormSchema.fieldConfig as Record<string, any>) || {},
          };
          setFormSchema(newFormSchema);

          const elements = convertSchemaToElements(
            zodSchema,
            newFormSchema.fieldConfig,
          );

          // Sort elements based on the order in fieldConfig
          const sortedElements = elements.sort(
            (a, b) =>
              (newFormSchema.fieldConfig[a.name].order || 0) -
              (newFormSchema.fieldConfig[b.name].order || 0),
          );

          setFormElements(sortedElements);
        }
      }
    }
  }, [initialFormSchema, convertSchemaToElements]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  console.log("formElements", formElements);
  const addFormElement = (type: InputType) => {
    const newElement: FormElement = {
      id: Date.now().toString(),
      type,
      name: `field_${Date.now()}`,
      label: `New ${type} input`,
      required: false,
      placeholder: `Enter ${type}`,
      order: formElements.length,
      options: type === "select" ? ["Option 1", "Option 2"] : undefined, // Initialize options as an empty array for select and multiSelect
    };
    setFormElements((prevElements) => {
      setIsAddingBlock(false);
      setEditingElement(newElement);
      console.log("newElement", newElement);
      updateFormSchema([...prevElements, newElement]);
      return [...prevElements, newElement];
    });
  };

  const updateFormElement = useCallback((updatedElement: FormElement) => {
    setFormElements((prevElements) => {
      const newElements = prevElements.map((el) =>
        el.id === updatedElement.id ? updatedElement : el,
      );
      updateFormSchema(newElements);
      return newElements;
    });
    setEditingElement(updatedElement);
    setUnsavedChanges(true);
  }, []);

  const updateFormSchema = useCallback((elements: FormElement[]) => {
    const schemaObj: Record<string, z.ZodTypeAny> = {};
    const fieldConfigObj: Record<string, any> = {};

    // Sort elements by order
    const sortedElements = [...elements].sort((a, b) => a.order - b.order);

    sortedElements.forEach((element) => {
      let fieldSchema: z.ZodTypeAny;

      switch (element.type) {
        case "text":
          fieldSchema = z.string();
          break;
        case "url":
          fieldSchema = z.string().url();
          break;
        case "phone":
          fieldSchema = z
            .string()
            .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/);
          break;
        case "email":
          fieldSchema = z.string().email();
          break;
        case "number":
        case "rating":
        case "scale":
        case "slider":
          fieldSchema = z.coerce.number();
          break;
        case "date":
          fieldSchema = z.coerce.date();
          break;
        case "checkbox":
          fieldSchema = z.boolean();
          break;
        case "select":
          const options = element.options?.filter(Boolean) || [
            "Option 1",
            "Option 2",
          ];
          fieldSchema =
            options.length === 1
              ? z.literal(options[0])
              : z.enum(options as [string, ...string[]]);
          break;
        default:
          fieldSchema = z.string();
      }

      fieldSchema = element.required ? fieldSchema : fieldSchema.optional();
      fieldSchema = fieldSchema.describe(element.label);

      schemaObj[element.name] = fieldSchema;

      fieldConfigObj[element.name] = {
        description: element.description,
        inputProps: {
          placeholder: element.placeholder,
          min: element.min,
          max: element.max,
          step: element.step,
          required: element.required,
          fieldType: element.type,
          options: element.options,
          label: element.label,
          name: element.name,
          id: element.id,
        },
        order: element.order,
      };

      if (element.type === "select") {
        fieldConfigObj[element.name].options = element.options || [
          "Option 1",
          "Option 2",
        ];
      }

      if (
        element.type === "number" ||
        element.type === "rating" ||
        element.type === "scale" ||
        element.type === "slider"
      ) {
        fieldConfigObj[element.name].inputProps.min = element.min;
        fieldConfigObj[element.name].inputProps.max = element.max;
        fieldConfigObj[element.name].inputProps.step = element.step;
      }
    });

    setFormSchema({
      schema: z.object(schemaObj),
      fieldConfig: fieldConfigObj,
    });
  }, []);

  console.log("formSchema", formSchema.schema.shape);

  const handleSave = () => {
    const orderedElements = [...formElements].sort((a, b) => a.order - b.order);
    const orderedSchemaObj: Record<string, z.ZodTypeAny> = {};
    const orderedFieldConfigObj: Record<string, any> = {};

    orderedElements.forEach((element, index) => {
      orderedSchemaObj[element.name] = formSchema.schema.shape[element.name];
      orderedFieldConfigObj[element.name] = {
        ...formSchema.fieldConfig[element.name],
        order: index,
      };
    });

    const orderedSchema = z.object(orderedSchemaObj);

    const jsonSchema = zodToJsonSchema(orderedSchema, "formSchema");

    console.log("jsonSchema", { orderedSchema, jsonSchema });

    fetcher.submit(
      {
        _action: "save",
        formSchema: JSON.stringify({
          schema: jsonSchema,
          fieldConfig: orderedFieldConfigObj,
          schemaVersion: form.schemaVersion,
        }),
      },
      { method: "post" },
    );
    setUnsavedChanges(false);
  };

  const handleDelete = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    fetcher.submit({ _action: "delete" }, { method: "post" });
    setIsDeleteDialogOpen(false);
  }, [fetcher]);

  useEffect(() => {
    if (
      fetcher.data &&
      typeof fetcher.data === "object" &&
      "success" in fetcher.data
    ) {
      setUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Form saved successfully",
      });
    } else if (
      fetcher.data &&
      typeof fetcher.data === "object" &&
      "error" in fetcher.data
    ) {
      toast({
        title: "Error",
        description: (fetcher.data as any).error,
        variant: "destructive",
      });
    }
  }, [fetcher.data, toast]);

  const handleSubmit = (data: z.infer<typeof formSchema.schema>) => {
    try {
      const validatedData = formSchema.schema.parse(data);
      const jsonSchema = zodToJsonSchema(formSchema.schema, "formSchema");

      console.log("Form submitted with valid data:", {
        validatedData,
        jsonSchema,
        formSchema,
      });

      // Handle form submission logic here
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Form submitted with errors:", error.errors);
      }
    }
  };

  const handleElementClick = (element: FormElement) => {
    setEditingElement(element);
    setIsAddingBlock(false);
  };

  const deleteFormElement = useCallback(() => {
    if (!editingElement) return;

    setFormElements((prevElements) => {
      const newElements = prevElements.filter(
        (el) => el.id !== editingElement.id,
      );
      updateFormSchema(newElements);
      return newElements;
    });

    setEditingElement(null);
    setIsElementDeleteDialogOpen(false);
    setUnsavedChanges(true);
  }, [editingElement, updateFormSchema]);

  const renderEditPanel = () => {
    if (!editingElement) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Edit {editingElement.type} Input
        </h3>
        <div>
          <Label htmlFor="name">Field Name</Label>
          <Input
            id="name"
            value={editingElement.name}
            onChange={(e) =>
              updateFormElement({ ...editingElement, name: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={editingElement.label}
            onChange={(e) =>
              updateFormElement({ ...editingElement, label: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={editingElement.placeholder}
            onChange={(e) =>
              updateFormElement({
                ...editingElement,
                placeholder: e.target.value,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editingElement.description}
            onChange={(e) =>
              updateFormElement({
                ...editingElement,
                description: e.target.value,
              })
            }
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={editingElement.required}
            onChange={(e) =>
              updateFormElement({
                ...editingElement,
                required: e.target.checked,
              })
            }
          />
          <Label htmlFor="required">Required</Label>
        </div>
        {renderSpecificSettings()}

        <AlertDialog
          open={isElementDeleteDialogOpen}
          onOpenChange={setIsElementDeleteDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full mt-4">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Element
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                form element.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteFormElement}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  const renderSpecificSettings = () => {
    if (!editingElement) return null;

    switch (editingElement.type) {
      case "number":
      case "rating":
      case "scale":
      case "slider":
        return (
          <>
            <div>
              <Label htmlFor="min">Min</Label>
              <Input
                id="min"
                type="number"
                value={editingElement.min}
                onChange={(e) =>
                  updateFormElement({
                    ...editingElement,
                    min: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="max">Max</Label>
              <Input
                id="max"
                type="number"
                value={editingElement.max}
                onChange={(e) =>
                  updateFormElement({
                    ...editingElement,
                    max: Number(e.target.value),
                  })
                }
              />
            </div>
            {editingElement.type === "slider" && (
              <div>
                <Label htmlFor="step">Step</Label>
                <Input
                  id="step"
                  type="number"
                  value={editingElement.step}
                  onChange={(e) =>
                    updateFormElement({
                      ...editingElement,
                      step: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
          </>
        );
      case "select":
        return (
          <div>
            <Label htmlFor="options">Options (one per line)</Label>
            <Textarea
              id="options"
              value={editingElement.options?.join("\n") || ""} // Provide a default empty string
              onChange={(e) =>
                updateFormElement({
                  ...editingElement,
                  options: e.target.value.split("\n"),
                })
              }
              className="min-h-[100px]"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFormElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update orders
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index,
        }));

        // Update the formSchema with the new order
        updateFormSchema(updatedItems);

        return updatedItems;
      });
      setUnsavedChanges(true);
    }
  };

  const orderedFormSchema = useMemo(() => {
    const orderedFields = Object.entries(formSchema.fieldConfig)
      .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
      .reduce(
        (acc, [key]) => {
          acc[key] = formSchema.schema.shape[key];
          return acc;
        },
        {} as Record<string, z.ZodTypeAny>,
      );

    return {
      schema: z.object(orderedFields),
      fieldConfig: formSchema.fieldConfig,
    };
  }, [formSchema]);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header
        ref={headerRef}
        formName={form.name}
        onSave={handleSave}
        onDelete={handleDelete}
        chatbotId={form.chatbotId}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        confirmDelete={confirmDelete}
        onViewSubmissions={() => setIsSubmissionsOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Structure */}
        <div className="w-64 bg-white p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Structure</h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={formElements.map((el) => el.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {formElements.map((element) => (
                  <SortableItem
                    key={element.id}
                    element={element}
                    onEdit={handleElementClick}
                    isActive={editingElement?.id === element.id}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <Button
            onClick={() => {
              setIsAddingBlock(true);
              setEditingElement(null);
            }}
            className="w-full mt-4"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Block
          </Button>
        </div>

        {/* Center Column - Preview */}
        <div
          className={`flex-grow p-8 overflow-y-auto transition-all duration-300 ${
            isAddingBlock || editingElement ? "mr-64" : ""
          }`}
        >
          <div className="mx-auto my-6 max-w-lg">
            <Card>
              <CardContent className="pt-6">
                <AutoForm
                  formSchema={orderedFormSchema.schema}
                  fieldConfig={orderedFormSchema.fieldConfig}
                  onSubmit={handleSubmit}
                >
                  <AutoFormSubmit>Submit</AutoFormSubmit>
                </AutoForm>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Edit */}
        <div
          className={cn(
            "fixed right-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out w-64",
            isAddingBlock || editingElement
              ? "translate-x-0"
              : "translate-x-full",
            `top-[${headerHeight}px]`,
          )}
          style={{
            height: `calc(100vh - ${headerHeight}px)`,
          }}
        >
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {isAddingBlock ? "Add Block" : "Edit Block"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsAddingBlock(false);
                  setEditingElement(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isAddingBlock ? (
              <div className="grid grid-cols-2 gap-2">
                {inputTypes.map((type) => (
                  <Button
                    key={type}
                    onClick={() => addFormElement(type)}
                    className="text-sm py-1 px-2 h-auto"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            ) : (
              renderEditPanel()
            )}
          </div>
        </div>
      </div>
      <SubmissionsModal
        isOpen={isSubmissionsOpen}
        onClose={() => setIsSubmissionsOpen(false)}
        submissions={form.submissions}
      />
    </div>
  );
}

function SortableItem({
  element,
  onEdit,
  isActive,
}: {
  element: FormElement;
  onEdit: (element: FormElement) => void;
  isActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onKeyDown={(e: React.KeyboardEvent<HTMLLIElement>) =>
        listeners?.onKeyDown?.(e as any)
      }
      onPointerDown={(e: React.PointerEvent<HTMLLIElement>) => {
        console.log("pointer down");
        onEdit(element);
        listeners?.onPointerDown?.(e as any)();
      }}
      className={cn(
        "flex items-center justify-between p-2 rounded cursor-pointer",
        isActive ? "bg-gray-200" : "bg-gray-50 hover:bg-gray-100",
      )}
    >
      <div className="flex items-center space-x-2">
        <span>
          <GripVertical className="h-4 w-4 text-gray-400" />
        </span>
        <span>{element.label}</span>
      </div>
      <span className="text-gray-500">{element.type}</span>
    </li>
  );
}

const Header = React.forwardRef<
  HTMLDivElement,
  {
    formName: string;
    onSave: () => void;
    onDelete: () => void;
    chatbotId: string;
    isDeleteDialogOpen: boolean;
    setIsDeleteDialogOpen: (open: boolean) => void;
    confirmDelete: () => void;
    onViewSubmissions: () => void;
  }
>(
  (
    {
      formName,
      onSave,
      onDelete,
      chatbotId,
      isDeleteDialogOpen,
      setIsDeleteDialogOpen,
      confirmDelete,
      onViewSubmissions,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className="flex justify-between items-center p-4 bg-white shadow-sm border-b"
      >
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/chatbots/${chatbotId}/forms`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{formName}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  form and remove its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" onClick={onViewSubmissions}>
            View submissions
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    );
  },
);

Header.displayName = "Header";

function SubmissionsModal({
  isOpen,
  onClose,
  submissions,
}: {
  isOpen: boolean;
  onClose: () => void;
  submissions: FormSubmission[];
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Submissions</DialogTitle>
        </DialogHeader>
        <div className="h-full pr-4">
          {submissions.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No submissions yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {submissions.map((submission) => (
                <Card key={submission.id} className="p-4">
                  {Object.entries(submission.submissionData).map(
                    ([key, value]) => (
                      <div key={key} className="mb-2">
                        <span className="font-bold">{key}:</span>{" "}
                        <span>{value}</span>
                      </div>
                    ),
                  )}
                  <div className="text-sm text-gray-500 mt-4">
                    Submitted on:{" "}
                    {DateTime.fromISO(submission.createdAt).toLocaleString(
                      DateTime.DATETIME_FULL,
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const handle = {
  PATH: (chatbotId: string, formId: string) => `/chatbots/${chatbotId}/forms`,
  breadcrumb: "forms",
};
