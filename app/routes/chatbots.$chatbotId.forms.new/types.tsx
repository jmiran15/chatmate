import { z } from "zod";

export interface FormSchema {
  schema: z.ZodObject<any>;
  fieldConfig: Record<string, any>;
}

export type InputType =
  | "text"
  | "date"
  | "url"
  | "phone"
  | "email"
  | "checkbox"
  | "select"
  | "multiSelect"
  | "number"
  | "rating"
  | "scale"
  | "slider";

export interface FormElement {
  id: string;
  type: InputType;
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  order: number; // Add this line
}

export const inputTypes: InputType[] = [
  "text",
  "date",
  "url",
  "phone",
  "email",
  "checkbox",
  "select",
  "multiSelect",
  "number",
  "rating",
  "scale",
  "slider",
];
