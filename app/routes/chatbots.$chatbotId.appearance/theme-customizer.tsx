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
import { useCallback, useState } from "react";
import { FileWithPreview, ImageCropper } from "./image-cropper";
import { FileWithPath, useDropzone } from "react-dropzone";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { LogoPicker } from "./logo-picker";

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

const INTENT = "update";

const accept = {
  "image/*": [],
};

export default function Customizer({
  fetcher,
  chatbot,
}: {
  fetcher: ReturnType<typeof useFetcher>;
  chatbot: Chatbot;
}) {
  const {
    publicName,
    logoUrl,
    themeColor,
    openIcon,
    introMessages,
    starterQuestions,
  } = chatbot;
  const intro = introMessages.join("\n");
  const starter = starterQuestions.join("\n");
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(
    null,
  );
  const [isDialogOpen, setDialogOpen] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        alert("Selected image is too large!");
        return;
      }

      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      setSelectedFile(fileWithPreview);
      setDialogOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
  });

  // IF we have a selected file - show the ImageCropper inside the fileuplaoder UI - with a cancel button
  // I should be able to drag in a new image onto the file uploader to replace the current image
  // if no url, show the default file uploader
  return (
    <div className="flex flex-col space-y-8 md:col-span-2 overflow-y-auto  md:border-r p-4">
      <LogoPicker />
      {/* <div className="flex flex-col gap-1.5">
        {selectedFile ? (
          <ImageCropper
            dialogOpen={isDialogOpen}
            setDialogOpen={setDialogOpen}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
        ) : (
          <Avatar
            {...getRootProps()}
            className="size-36 cursor-pointer ring-offset-2 ring-2 ring-slate-200"
          >
            <input {...getInputProps()} />
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        )}
      </div> */}
      <div className="flex flex-col gap-1.5">
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
              { method: "post" },
            )
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="url">Logo url</Label>
        <Input
          id="url"
          placeholder="Enter your logo url"
          defaultValue={logoUrl ?? ""}
          onChange={(e) =>
            fetcher.submit(
              {
                intent: INTENT,
                update: JSON.stringify({ logoUrl: e.target.value }),
              },
              { method: "post" },
            )
          }
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
              { method: "post" },
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
              { method: "post" },
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
              { method: "post" },
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
              { method: "post" },
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
