import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useFetcher } from "@remix-run/react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function Customizer({
  name,
  // bio,
  introMessages,
  // starterQuestions,
  color,
}: {
  name: string;
  // bio: string;
  introMessages: string[];
  // starterQuestions: string[];
  color: string;
}) {
  const intro = introMessages.join("\n");
  // const starter = starterQuestions.join("\n");
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
        <Label htmlFor="name">Chatbot name</Label>
        <p className="text-sm text-muted-foreground">
          This is the name of your chatbot that will be displayed on the widget
          header.
        </p>
        <Input
          id="name"
          name="name"
          placeholder="Enter your chatbot name"
          defaultValue={name}
        />
      </div>
      {/* 
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Chatbot bio</Label>
        <p className="text-sm text-muted-foreground">
          The bio will be displayed below the chatbot name.
        </p>
        <Input
          id="bio"
          name="bio"
          placeholder="Enter your chatbot bio"
          defaultValue={bio}
        />
      </div> */}

      <div className="flex flex-col gap-1.5">
        <Label>Theme color</Label>
        <p className="text-sm text-muted-foreground">
          The theme color will be applied to the user messages, send button, and
          widget button.
        </p>
        <Input type="color" name="color" defaultValue={color} />
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

      {/* <div className="flex flex-col gap-1.5">
        <Label htmlFor="starter">Starter queries</Label>
        <Textarea
          id="starter"
          name="starter"
          placeholder={`Enter your starter queries\nOne per line\nLike this`}
          rows={5}
          defaultValue={starter}
        />
        <p className="text-sm text-muted-foreground">
          These questions will be shown when the chatbot is first opened.
        </p>
      </div> */}

      <Button type="submit" className="self-start" onClick={handleSubmit}>
        Update appearance
      </Button>
    </fetcher.Form>
  );
}
