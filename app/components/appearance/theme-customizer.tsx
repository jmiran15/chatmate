import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useFetcher } from "@remix-run/react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const THEME_COLORS = [
  "zinc",
  "white",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const OPEN_ICONS = ["plus", "chevron", "chat"];

export default function Customizer({
  name,
  url,
  color,
  icon,
  introMessages,
}: {
  name: string;
  url: string;
  color: string;
  icon: string;
  introMessages: string[];
}) {
  const intro = introMessages.join("\n");
  const fetcher = useFetcher();

  function handleSubmit(event) {
    fetcher.submit(event.currentTarget.form, {
      method: "POST",
    });
  }

  return (
    <fetcher.Form
      method="POST"
      className="flex flex-col space-y-8 lg:col-span-2 lg:h-full lg:overflow-y-auto lg:border-r border-b border-gray-200 p-8"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your chatbot name"
          defaultValue={name}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="url">Logo url</Label>
        <Input
          id="url"
          name="url"
          placeholder="Enter your logo url"
          defaultValue={url}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Theme color</Label>
        <Select name="color" defaultValue={color}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a theme color" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Theme color</SelectLabel>
              {THEME_COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Open button icon</Label>
        <Select name="icon" defaultValue={icon}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select an icon" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Icon</SelectLabel>
              {OPEN_ICONS.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  {icon}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="intro">Intro messages</Label>
        <Textarea
          id="intro"
          name="intro"
          placeholder={`Enter your intro messages\nOne per line\nLike this`}
          rows={5}
          defaultValue={intro}
        />
        <p className="text-sm text-muted-foreground">
          These messages will be shown when the chatbot is first opened.
        </p>
      </div>
      <Button type="submit" className="self-start" onClick={handleSubmit}>
        Update appearance
      </Button>
    </fetcher.Form>
  );
}
