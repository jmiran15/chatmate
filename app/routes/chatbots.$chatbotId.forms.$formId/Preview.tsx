import type { FormElement } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { z } from "zod";
import AutoForm, { AutoFormSubmit } from "~/components/ui/auto-form";
import { Card, CardContent } from "~/components/ui/card";
import { useAutoForm } from "./useAutoForm";

export default function FormPreview({
  optimisticFormElements,
}: {
  optimisticFormElements: SerializeFrom<FormElement[]>;
}) {
  const { formSchema, fieldConfig } = useAutoForm(optimisticFormElements);

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
    <div className="flex-grow p-8 overflow-y-auto transition-all duration-300">
      <div className="mx-auto w-full">
        <Card className="max-w-md">
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
