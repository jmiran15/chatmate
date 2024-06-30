import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useFetcher } from "@remix-run/react";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Chatbot } from "@prisma/client";
import { ImagePicker } from "./image-picker";

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

const CONTAINER_RADIUS = [
  { label: "none", value: "0" },
  { label: "sm", value: "0.3" },
  { label: "md", value: "0.5" },
  {
    label: "lg",
    value: "0.75",
  },
  { label: "xl", value: "1.0" },
];

const OPEN_ICONS = ["plus", "chevron", "chat"];

const INTENT = "generalUpdate";

export default function Customizer({
  fetcher,
  chatbot,
}: {
  fetcher: ReturnType<typeof useFetcher>;
  chatbot: Chatbot;
}) {
  const {
    publicName,
    originalLogoFilepath,
    croppedLogoFilepath,
    lastCrop,
    themeColor,
    openIcon,
    introMessages,
    starterQuestions,
    containerRadius,
    openButtonText,
  } = chatbot;
  const intro = introMessages.join("\n");
  const starter = starterQuestions.join("\n");

  return (
    <div className="flex flex-col gap-8 p-4 overflow-y-auto md:col-span-2 md:border-r w-full">
      <div className="flex flex-col gap-1.5 w-full">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter your chatbot name"
          defaultValue={publicName}
          onChange={(e) =>
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({ publicName: e.target.value }),
              },
              { method: "post", encType: "multipart/form-data" },
            )
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Logo url</Label>
        <ImagePicker
          originalLogoFilepath={originalLogoFilepath}
          croppedLogoFilepath={croppedLogoFilepath}
          savedCrop={lastCrop}
          fetcher={fetcher}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Theme color</Label>
        <Select
          name="color"
          defaultValue={themeColor}
          onValueChange={(value) => {
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({ themeColor: value }),
              },
              { method: "post", encType: "multipart/form-data" },
            );
          }}
        >
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
        <Select
          name="icon"
          defaultValue={openIcon}
          onValueChange={(value) => {
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({ openIcon: value }),
              },
              { method: "post", encType: "multipart/form-data" },
            );
          }}
        >
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

      <div className="flex flex-col gap-1.5 w-full">
        <Label htmlFor="opentext">Open button text</Label>
        <Input
          id="opentext"
          placeholder="Chat with us..."
          defaultValue={openButtonText ?? ""}
          onChange={(e) =>
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({ openButtonText: e.target.value }),
              },
              { method: "post", encType: "multipart/form-data" },
            )
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Container border radius</Label>
        <Select
          name="containerRadius"
          defaultValue={String(containerRadius) ?? "0"}
          onValueChange={(value) => {
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({ containerRadius: value }),
              },
              { method: "post", encType: "multipart/form-data" },
            );
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a border radius" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Border radius</SelectLabel>
              {CONTAINER_RADIUS.map((radius, index) => (
                <SelectItem key={index} value={radius.value}>
                  {radius.label}
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
          onChange={(e) =>
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({
                  introMessages: e.target.value.split("\n"),
                }),
              },
              { method: "post", encType: "multipart/form-data" },
            )
          }
        />
        <p className="text-sm text-muted-foreground">
          These messages will be shown when the chatbot is first opened.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="starter">Starter questions</Label>
        <Textarea
          id="starter"
          name="starter"
          placeholder={`Enter your starter questions\nOne per line\nLike this`}
          rows={5}
          defaultValue={starter}
          onChange={(e) =>
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({
                  starterQuestions: e.target.value.split("\n"),
                }),
              },
              { method: "post", encType: "multipart/form-data" },
            )
          }
        />
        <p className="text-sm text-muted-foreground">
          These questions will be shown when the chatbot is first opened.
        </p>
      </div>
    </div>
  );
}
