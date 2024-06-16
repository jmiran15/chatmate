import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  SubmitOptions,
  useActionData,
  useNavigation,
  useParams,
  useSubmit,
} from "@remix-run/react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { STEPS } from "~/utils/types";
import { Checkbox } from "~/components/ui/checkbox";
import { useEventSource } from "remix-utils/sse/react";
import LinksTable from "./links-table";

const MAX_CRAWLED_LINKS = 100;

export default function Website({
  setStep,
  setOpen,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
}) {
  const actionData = useActionData();
  const submit = useSubmit();
  const { chatbotId } = useParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [isTableVisible, setIsTableVisible] = useState(false);
  const job = actionData?.job;
  const eventSource = useEventSource(`/api/crawl/${job?.id}/progress`);
  const [links, setLinks] = useState<string[]>(
    Array(MAX_CRAWLED_LINKS).fill(""),
  );
  const disableNextButton = isTableVisible && links.length === 0;
  const selectedLinks =
    links?.length > 0
      ? Object.keys(rowSelection).map((index) => links[index as number])
      : [];

  // showing crawl progress
  useEffect(() => {
    if (!job) return;
    if (!eventSource) return;
    console.log("website.tsx - progress caused a rerender");
    const progress = JSON.parse(eventSource);
    if (progress?.completed && progress.returnvalue) {
      setLinks(progress.returnvalue.urls || []);
    } else if (progress?.progress) {
      setLinks((prev) => [...prev, progress.progress.currentDocumentUrl ?? ""]);
    }
  }, [eventSource, job]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add website/s</DialogTitle>
        <DialogDescription>Add a website/s to your chatbot.</DialogDescription>
      </DialogHeader>

      {isTableVisible ? (
        <LinksTable
          links={links}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      ) : (
        <Form className="grid gap-6" method="post" ref={formRef}>
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
            <div className="flex items-center space-x-2">
              <Checkbox name="crawl" id="crawl" />
              <Label htmlFor="crawl">Crawl entire website</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Leave this unchecked if you want to scrape a single URL.
            </p>
          </div>
        </Form>
      )}
      <DialogFooter>
        <div className="w-full flex flex-row justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (isTableVisible) {
                setIsTableVisible(false);
              } else {
                setStep(STEPS.SELECT_TYPE);
              }
            }}
          >
            Back
          </Button>
          <Button
            disabled={disableNextButton}
            onClick={() => {
              const options = {
                method: "post",
                action: `/chatbots/${chatbotId}/data?index`,
              } as SubmitOptions;

              // the formRef is rendered
              if (formRef.current) {
                if (formRef.current.crawl["1"].checked) {
                  setIsTableVisible(true);
                  submit(
                    {
                      intent: "getLinks",
                      url: formRef.current?.url.value,
                    },
                    options,
                  );
                } else {
                  setOpen(false);
                  submit(
                    {
                      intent: "scrapeLinks",
                      links: JSON.stringify([formRef.current?.url.value]),
                    },
                    options,
                  );
                }
              } else {
                setOpen(false);
                submit(
                  {
                    intent: "scrapeLinks",
                    links: JSON.stringify(selectedLinks),
                  },
                  options,
                );
              }
            }}
          >
            Next
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
