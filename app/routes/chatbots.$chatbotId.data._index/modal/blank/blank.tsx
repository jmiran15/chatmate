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
  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Blank</DialogTitle>
        <DialogDescription>
          Upload a blank file to use as a starting point for your chatbot.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
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
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={() => {}}>
          Cancel
        </Button>
        <Button onClick={() => {}}>Upload</Button>
      </DialogFooter>
    </>
  );
}
