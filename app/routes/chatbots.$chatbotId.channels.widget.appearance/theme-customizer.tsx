import { Chatbot, WidgetPosition } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { forwardRef } from "react";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import Description from "../chatbots.$chatbotId.forms._index/Description";
import Title from "../chatbots.$chatbotId.forms._index/Title";
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

const WIDGET_POSITIONS = [
  { label: "Bottom Right", value: WidgetPosition.BOTTOM_RIGHT },
  { label: "Bottom Left", value: WidgetPosition.BOTTOM_LEFT },
];

const Customizer = forwardRef<
  HTMLDivElement,
  {
    fetcher: ReturnType<typeof useFetcher>;
    chatbot: Chatbot;
  }
>(({ fetcher, chatbot }, ref) => {
  const {
    publicName,
    subheader,
    originalLogoFilepath,
    croppedLogoFilepath,
    lastCrop,
    themeColor,
    openIcon,
    introMessages,
    starterQuestions,
    containerRadius,
    openButtonText,
    widgetRestrictedUrls,
    widgetPosition,
    showIntroPreview = true,
  } = chatbot;
  const intro = introMessages.join("\n");
  const starter = starterQuestions.join("\n");
  const restrictedUrls = widgetRestrictedUrls.join("\n");

  return (
    <div
      ref={ref}
      className="flex flex-col gap-8 py-8 px-4 overflow-y-auto md:col-span-2 w-full no-scrollbar"
    >
      <Header />
      <Separator />
      <div className="flex flex-col gap-2 w-full">
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
      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="subheader">Subheader</Label>
        <Input
          id="subheader"
          placeholder="Enter your chatbot subheader"
          defaultValue={subheader ?? ""}
          onChange={(e) =>
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({ subheader: e.target.value }),
              },
              { method: "post", encType: "multipart/form-data" },
            )
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Logo url</Label>
        <ImagePicker
          originalLogoFilepath={originalLogoFilepath}
          croppedLogoFilepath={croppedLogoFilepath}
          savedCrop={lastCrop}
          fetcher={fetcher}
        />
      </div>
      <div className="flex flex-col gap-2">
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
          <SelectTrigger className="w-full max-w-xs">
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
      <div className="flex flex-col gap-2">
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
          <SelectTrigger className="w-full max-w-xs">
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
      <div className="flex flex-col gap-2 w-full">
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
      <div className="flex flex-col gap-2">
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
          <SelectTrigger className="w-full max-w-xs">
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
      <div className="flex flex-col gap-2">
        <Label>Widget Position</Label>
        <Select
          name="widgetPosition"
          defaultValue={widgetPosition ?? WidgetPosition.BOTTOM_RIGHT}
          onValueChange={(value: WidgetPosition) => {
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({ widgetPosition: value }),
              },
              { method: "post", encType: "multipart/form-data" },
            );
          }}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select widget position" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Widget Position</SelectLabel>
              {WIDGET_POSITIONS.map((position) => (
                <SelectItem key={position.value} value={position.value}>
                  {position.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Preview Intro Messages</Label>
            <p className="text-sm text-muted-foreground">
              Show intro messages in a preview bubble when the chat is closed
            </p>
          </div>
          <Switch
            checked={showIntroPreview ?? true}
            onCheckedChange={(checked) =>
              fetcher.submit(
                {
                  intent: INTENT,
                  update: JSON.stringify({ showIntroPreview: checked }),
                },
                { method: "post", encType: "multipart/form-data" },
              )
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="restrict">Restrict paths</Label>
        <Textarea
          id="restrict"
          placeholder={`Enter paths to restrict\nOne per line\nLike this\nYou can use * as a wildcard to match any characters\nExample: /blog/*`}
          rows={5}
          defaultValue={restrictedUrls}
          onChange={(e) =>
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({
                  widgetRestrictedUrls: e.target.value.split("\n"),
                }),
              },
              { method: "post", encType: "multipart/form-data" },
            )
          }
        />
        <p className="text-sm text-muted-foreground">
          Include all paths to your website where you would like the chatbot
          widget to not appear.
        </p>
      </div>
    </div>
  );
});

function Header() {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between">
      <div className="flex flex-col">
        <Title>Widget Appearance</Title>
        <Description>
          Customize the appearance of the chatbot widget.
        </Description>
      </div>
    </div>
  );
}

Customizer.displayName = "Customizer";

export default Customizer;
