import { Form } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { FlowSchema } from "./route";

export default function Action({
  toggleCard,
  openCards,
  form,
  index,
  field,
  remove,
  forms,
}: {
  toggleCard: (id: string) => void;
  openCards: Record<string, boolean>;
  form: UseFormReturn<FlowSchema>;
  index: number;
  field: FieldArrayWithId<FlowSchema, "actions">;
  remove: (index: number) => void;
  forms: SerializeFrom<Pick<Form, "id" | "name">>[];
}) {
  return (
    <Card key={field.id} className="w-full max-w-4xl">
      <CardHeader
        className="cursor-pointer"
        onClick={() => toggleCard(field.id)}
      >
        <CardTitle className="flex justify-between items-center">
          <span>Action {index + 1}</span>
          {openCards[field.id] ? <ChevronUp /> : <ChevronDown />}
        </CardTitle>
      </CardHeader>
      {openCards[field.id] && (
        <CardContent>
          <FormField
            control={form.control}
            name={`actions.${index}.type`}
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          {form.watch(`actions.${index}.type`) === "form" && (
            <FormField
              control={form.control}
              name={`actions.${index}.formId`}
              render={({ field }) => (
                <FormItem className="mt-4">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a form" />
                    </SelectTrigger>
                    <SelectContent>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {form.watch(`actions.${index}.type`) === "text" && (
            <FormField
              control={form.control}
              name={`actions.${index}.text`}
              render={({ field }) => (
                <FormItem className="mt-4">
                  <Textarea {...field} placeholder="Enter text" />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name={`actions.${index}.delay`}
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Delay (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      )}
      {openCards[field.id] && (
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => toggleCard(field.id)}>
            Close
          </Button>
          {index > 0 && (
            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
