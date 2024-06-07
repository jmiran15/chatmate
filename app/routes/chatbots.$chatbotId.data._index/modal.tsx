import {
  Form,
  useActionData,
  useFetcher,
  useNavigation,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import { set } from "date-fns";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import SelectUrls from "./table/select-urls";

export function DialogDemo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const step = searchParams?.get("step");
  const type = searchParams?.get("type");
  const jobId = searchParams?.get("jobId");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setSearchParams({ step: "type" })}
        >
          Add data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh]">
        {step === "type" ? (
          <SelectType setSearchParams={setSearchParams} />
        ) : null}
        {step === "data" && type === "website" ? (
          <Website setSearchParams={setSearchParams} />
        ) : null}
        {step === "select" && type === "website" && jobId ? (
          <SelectUrls />
        ) : null}
        {step === "data" && type === "file" ? <File /> : null}
        {step === "data" && type === "blank" ? <Blank /> : null}
      </DialogContent>
    </Dialog>
  );
}

function SelectType({
  setSearchParams,
}: {
  setSearchParams: (params: { step: string; type?: string }) => void;
}) {
  return (
    <div>
      <Button
        onClick={() => setSearchParams({ step: "data", type: "website" })}
      >
        Website
      </Button>
      <Button onClick={() => setSearchParams({ step: "data", type: "file" })}>
        File
      </Button>
      <Button onClick={() => setSearchParams({ step: "data", type: "blank" })}>
        Blank
      </Button>
    </div>
  );
}

function Website({
  setSearchParams,
}: {
  setSearchParams: (params: { step: string; type?: string }) => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Add website/s</DialogTitle>
        <DialogDescription>Add a website/s to your chatbot.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div>Website</div>
      </div>
      <WebCrawl />
    </>
  );
}

function WebCrawl() {
  const navigation = useNavigation();
  const { chatbotId } = useParams();
  const pending =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "crawl";

  const actionData = useActionData();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    console.log("actionData", actionData);
    if (actionData?.intent === "crawl" && actionData?.jobId) {
      setSearchParams({
        step: "select",
        type: "website",
        jobId: actionData.jobId,
      });
    }
  }, [actionData]);

  return (
    <Form
      className="grid gap-4"
      method="post"
      action={`/chatbots/${chatbotId}/data?index`}
    >
      <input type="hidden" name="intent" value="crawl" />
      <div className="grid gap-2">
        <Label htmlFor="url">URL</Label>
        <Input
          name="url"
          autoComplete="url"
          id="url"
          type="url"
          placeholder="https://example.com"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="paths">Paths to exclude</Label>
        <Input
          name="paths"
          autoComplete="paths"
          id="paths"
          type="text"
          placeholder="e.g. /blog, /about"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        Next
      </Button>
    </Form>
  );
}

function WebScrape() {
  // just an input for the url to scrape
  return null;
}

function File() {
  return <div>File</div>;
}

function Blank() {
  return <div>Blank</div>;
}
