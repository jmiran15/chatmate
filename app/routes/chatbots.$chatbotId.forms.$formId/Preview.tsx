import type { FormElement } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo } from "react";
import { z } from "zod";
import AutoForm, { AutoFormSubmit } from "~/components/ui/auto-form";
import { Card, CardContent } from "~/components/ui/card";
import Slider from "./FormSlider";
import { loader } from "./route";
import Scale from "./Scale";
import StarRating from "./StarRating";

export default function FormPreview({
  optimisticFormElements,
  isAddingBlock,
  editingElement,
}: {
  optimisticFormElements: SerializeFrom<FormElement[]>;
  isAddingBlock: boolean;
  editingElement: SerializeFrom<FormElement> | null;
}) {
  const { clientTypes } = useLoaderData<typeof loader>();

  const { formSchema, fieldConfig } = useMemo(() => {
    const schemaObj: Record<string, z.ZodTypeAny> = {};
    const fieldConfigObj: Record<string, any> = {};

    // model FormElement {
    //     id                 String    @id @default(cuid())
    //     createdAt          DateTime  @default(now())
    //     updatedAt          DateTime  @updatedAt
    //     formId             String
    //     form               Form      @relation(fields: [formId], references: [id], onDelete: Cascade)
    //     type               InputType @default(TEXT)
    //     name               String
    //     label              String
    //     required           Boolean   @default(false)
    //     placeholder        String?
    //     description        String?
    //     options            String[]
    //     min                Int?
    //     max                Int?
    //     step               Int?
    //     order              Int       @default(0)
    //     required_error     String?   @default("This field is required")
    //     min_error          String?   @default("Please enter a value greater than the minimum")
    //     max_error          String?   @default("Please enter a value less than the maximum")
    //     invalid_type_error String?   @default("Please enter a valid value")
    //   }

    optimisticFormElements.forEach((element: SerializeFrom<FormElement>) => {
      let fieldSchema: z.ZodTypeAny;

      const requiredErrorOptions = element.required
        ? { required_error: element.required_error ?? "This field is required" }
        : {};
      const invalidTypeErrorOptions = element.invalid_type_error
        ? { invalid_type_error: element.invalid_type_error }
        : {};

      const zodOptions = {
        ...requiredErrorOptions,
        ...invalidTypeErrorOptions,
      };

      switch (element.type) {
        case clientTypes.TEXT:
          fieldSchema = z.string(zodOptions);
          break;
        case clientTypes.URL:
          fieldSchema = z.string(zodOptions).url();
          break;
        case clientTypes.PHONE:
          fieldSchema = z
            .string(zodOptions)
            .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/);
          break;
        case clientTypes.EMAIL:
          fieldSchema = z.string(zodOptions).email();
          break;
        case clientTypes.NUMBER:
        case clientTypes.RATING:
        case clientTypes.SCALE:
        case clientTypes.SLIDER:
          fieldSchema = z.coerce.number(zodOptions);
          break;
        case clientTypes.DATE:
          fieldSchema = z.coerce.date(zodOptions);
          break;
        case clientTypes.CHECKBOX:
          fieldSchema = z.boolean(zodOptions);
          break;
        case clientTypes.SELECT:
          const options = element.options?.filter(Boolean) || [
            "Option 1",
            "Option 2",
          ];
          fieldSchema =
            options.length === 1
              ? z.literal(options[0], zodOptions)
              : z.enum(options as [string, ...string[]], zodOptions);
          break;
        default:
          fieldSchema = z.string(zodOptions);
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
          //   fieldType: element.type,
          //   options: element.options,
          label: element.label,
          name: element.name,
          id: element.id,
        },
      };

      if (element.type === clientTypes.SELECT) {
        fieldConfigObj[element.name].options = element.options || [
          "Option 1",
          "Option 2",
        ];
      }

      if (
        element.type === clientTypes.NUMBER ||
        element.type === clientTypes.RATING ||
        element.type === clientTypes.SCALE ||
        element.type === clientTypes.SLIDER
      ) {
        if (fieldSchema instanceof z.ZodNumber) {
          fieldSchema = fieldSchema
            .min(element.min ?? -Infinity, {
              message:
                element.min_error ??
                "Please enter a value greater than the minimum",
            })
            .max(element.max ?? Infinity, {
              message:
                element.max_error ??
                "Please enter a value less than the maximum",
            });

          fieldConfigObj[element.name].inputProps.min =
            element.min ?? undefined;
          fieldConfigObj[element.name].inputProps.max =
            element.max ?? undefined;
          fieldConfigObj[element.name].inputProps.step = element.step;
        }
      }

      if (element.type === clientTypes.TEXTAREA) {
        fieldConfigObj[element.name].fieldType = "textarea";
      }

      if (element.type === clientTypes.RATING) {
        fieldConfigObj[element.name].fieldType = StarRating;
      }

      if (element.type === clientTypes.SCALE) {
        fieldConfigObj[element.name].fieldType = Scale;
      }

      if (element.type === clientTypes.SLIDER) {
        fieldConfigObj[element.name].fieldType = Slider;
      }

      // if the element is a "slider" make it a slider
    });

    return {
      formSchema: z.object(schemaObj),
      fieldConfig: fieldConfigObj,
    };
  }, [optimisticFormElements]);

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    try {
      const validatedData = formSchema.parse(data);
      console.log("validatedData", validatedData);

      // Handle form submission logic here
      // somehow show validation errors in the form?
    } catch (error) {
      if (error instanceof z.ZodError) {
        // console.log("Form submitted with errors:", error.errors);
      }
    }
  };

  return (
    <div
      className={`flex-grow p-8 overflow-y-auto transition-all duration-300 ${
        isAddingBlock || editingElement ? "mr-64" : ""
      }`}
    >
      <div className="mx-auto my-6 max-w-lg">
        <Card>
          <CardContent className="pt-6">
            <AutoForm
              formSchema={formSchema}
              fieldConfig={fieldConfig}
              onSubmit={handleSubmit}
            >
              <AutoFormSubmit>Submit</AutoFormSubmit>
            </AutoForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
