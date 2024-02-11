import { ResetIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { useFetcher } from "@remix-run/react";
import { Slider } from "../ui/slider";

export default function Customizer({
  introMessages,
  starterQuestions,
  color,
  radius,
}: {
  introMessages: string;
  starterQuestions: string;
  color: string;
  radius: number;
}) {
  const fetcher = useFetcher();
  return (
    <ScrollArea className="flex-1 overflow-y-auto h-full">
      <div className="flex items-start pt-4 md:pt-0">
        <div className="space-y-1 pr-2">
          <div className="font-semibold leading-none tracking-tight">
            Customize
          </div>
          <div className="text-xs text-muted-foreground">
            Customize the style of your chatbot widget.
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto rounded-[0.5rem]"
          onClick={() => {
            const formData = new FormData();
            formData.append("field", "reset");
            fetcher.submit(formData, { method: "POST" });
          }}
        >
          <ResetIcon />
          <span className="sr-only">Reset</span>
        </Button>
      </div>
      <fetcher.Form
        method="POST"
        className="flex flex-1 flex-col space-y-4 md:space-y-6"
      >
        <div className="grid w-full gap-1.5">
          <Label htmlFor="intro">Intro messages</Label>
          <Textarea
            id="intro"
            name="intro"
            placeholder="Enter your intro messages seperated by a comma"
            rows={3}
            defaultValue={introMessages}
            onChange={(e) => {
              const text = e.target.value;
              const formData = new FormData();
              formData.append("field", "intro");
              formData.append("value", text);
              fetcher.submit(formData, { method: "POST" });
            }}
          />
          <p className="text-sm text-muted-foreground">
            These messages will be shown when the chatbot is first opened.
          </p>
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="starter">Starter questions</Label>
          <Textarea
            id="starter"
            name="starter"
            placeholder="Enter some starter questions seperated by a comma"
            rows={3}
            defaultValue={starterQuestions}
            onChange={(e) => {
              const text = e.target.value;
              const formData = new FormData();
              formData.append("field", "starter");
              formData.append("value", text);
              fetcher.submit(formData, { method: "POST" });
            }}
          />
          <p className="text-sm text-muted-foreground">
            These questions will be shown when the chatbot is first opened.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Color</Label>
          <input
            id="nativeColorPicker1"
            type="color"
            defaultValue={color}
            onChange={(e) => {
              const formData = new FormData();
              formData.append("field", "color");
              formData.append("value", e.target.value);
              fetcher.submit(formData, { method: "POST" });
            }}
          />
        </div>

        <div>
          <label
            htmlFor="radius"
            className="block mb-2 font-medium text-gray-900 dark:text-white"
          >
            <span>Radius </span>

            <Slider
              id="radius"
              defaultValue={[radius]}
              name="radius"
              min={0}
              max={2}
              step={0.01}
              className="w-full"
              onValueChange={(e) => {
                const formData = new FormData();
                formData.append("field", "radius");
                formData.append("value", e[0]);
                fetcher.submit(formData, { method: "POST" });
              }}
            />
          </label>
        </div>
      </fetcher.Form>
    </ScrollArea>
  );
}
