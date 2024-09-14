import { ChevronDown, ChevronUp } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { FlowSchema } from "./route";

export default function Trigger({
  toggleCard,
  openCards,
  form,
}: {
  toggleCard: (id: string) => void;
  openCards: Record<string, boolean>;
  form: UseFormReturn<FlowSchema>;
}) {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader
        className="cursor-pointer"
        onClick={() => toggleCard("trigger")}
      >
        <CardTitle className="flex justify-between items-center">
          Trigger
          {openCards["trigger"] ? <ChevronUp /> : <ChevronDown />}
        </CardTitle>
      </CardHeader>
      {openCards["trigger"] && (
        <CardContent>
          <FormField
            control={form.control}
            name="trigger.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trigger Type</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "onInitialLoad") {
                        form.setValue("trigger.description", undefined);
                      }
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onInitialLoad">
                        On initial load
                      </SelectItem>
                      <SelectItem value="customTrigger">
                        Custom trigger
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("trigger.type") === "customTrigger" && (
            <FormField
              control={form.control}
              name="trigger.description"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter a detailed description of when the chatbot should trigger this flow."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      )}
      {openCards["trigger"] && (
        <CardFooter>
          <Button variant="ghost" onClick={() => toggleCard("trigger")}>
            Close
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
