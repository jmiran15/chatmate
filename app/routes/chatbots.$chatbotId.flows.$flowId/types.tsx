import { z } from "zod";

export const triggerSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["INITIAL_LOAD", "CUSTOM_EVENT"]),
  description: z.string().optional(),
});

export const actionSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(["FORM", "TEXT"]),
    formId: z.string().optional(),
    text: z.string().optional(),
    delay: z.number().optional(),
    order: z.number().optional(),
    mentions: z
      .array(
        z.object({
          id: z.string(),
          display: z.string(),
          childIndex: z.number(),
          index: z.number(),
          plainTextIndex: z.number(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type === "FORM") {
        return !!data.formId;
      } else {
        return !!data.text;
      }
    },
    {
      message: "Form or text is required based on the selected type",
      path: ["formId"],
    },
  );

export const flowSchema = z.object({
  name: z.string(),
  trigger: triggerSchema,
  actions: z.array(actionSchema).min(1, "At least one action is required"),
});

export type FlowSchema = z.infer<typeof flowSchema>;
export type ActionSchema = z.infer<typeof actionSchema>;
export type TriggerSchema = z.infer<typeof triggerSchema>;
