import { Form, useParams, useSearchParams, useSubmit } from "@remix-run/react";
import { useRef } from "react";
import { Button } from "~/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export default function BlankUpload() {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();
  const { chatbotId } = useParams();

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Blank</DialogTitle>
        <DialogDescription>
          Upload a blank file to use as a starting point for your chatbot.
        </DialogDescription>
      </DialogHeader>
      <Form
        ref={formRef}
        className="grid gap-4"
        method="post"
        action={`/chatbots/${chatbotId}/data`}
      >
        <input type="hidden" name="intent" value="createDocument" />
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            name="name"
            autoComplete="name"
            id="name"
            type="text"
            placeholder="Name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            name="content"
            autoComplete="content"
            id="content"
            placeholder="Content"
            required
          />
        </div>
      </Form>
      <DialogFooter>
        <div className="w-full flex flex-row justify-between">
          <Button
            variant="ghost"
            onClick={() => setSearchParams({ step: "type" })}
          >
            Cancel
          </Button>
          <Button onClick={() => submit(formRef.current)}>Upload</Button>
        </div>
      </DialogFooter>
    </>
  );
}
