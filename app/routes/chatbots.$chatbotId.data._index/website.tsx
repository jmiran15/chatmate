import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Form, SubmitOptions, useFetcher, useParams } from "@remix-run/react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { STEPS } from "~/utils/types";
import { Checkbox } from "~/components/ui/checkbox";
import { useEventSource } from "remix-utils/sse/react";
import LinksTable from "./links-table";
import { action } from "./route";
import { Progress } from "../api.crawl.$jobId.progress";

export default function Website({
  setStep,
  setOpen,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
}) {
  const { chatbotId } = useParams();

  // TODO - fix type
  const fetcher = useFetcher<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [isTableVisible, setIsTableVisible] = useState(false);
  const job = fetcher.data?.job;
  const eventSource: string | undefined = useEventSource(
    `/api/crawl/${job?.id}/progress`,
  );

  const progress: Progress | undefined = useMemo(() => {
    return eventSource ? JSON.parse(eventSource) : undefined;
  }, [eventSource]);

  const disableNextButton = isTableVisible && links.length === 0;
  const selectedLinks =
    links?.length > 0
      ? Object.keys(rowSelection).map((index) => links[Number(index)])
      : [];

  // crawl progress
  // TODO - lots of unneeded re-renders here - causing performance issues
  useEffect(() => {
    console.log("website.tsx - progress: ", progress);
    if (job?.id !== progress?.jobId) {
      setLinks([]);
      return;
    } else {
      if (progress?.returnvalue) {
        setLinks(progress.returnvalue.urls || []);
      } else if (progress?.progress) {
        setLinks((prev) => [
          ...prev,
          progress.progress?.currentDocumentUrl ?? "",
        ]);
      }
    }
  }, [progress?.progress?.currentDocumentUrl, progress?.returnvalue, job?.id]);

  useEffect(() => {
    // TODO - this is not optimistic - it is waiting for data

    if (!fetcher.data?.errors) {
      switch (fetcher.data?.intent) {
        case "scrapeLinks":
          setOpen(false);
          break;
        case "getLinks":
          setIsTableVisible(true);
          break;
      }
    } else {
      if (fetcher.data?.errors?.url) {
        urlRef.current?.focus();
      }
    }
  }, [fetcher.data]);

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
              ref={urlRef}
              autoFocus={true}
              name="url"
              autoComplete="url"
              aria-invalid={fetcher.data?.errors?.url ? true : undefined}
              aria-describedby="url-error"
              id="url"
              type="url"
              placeholder="https://example.com"
              required
            />

            {fetcher.data?.errors?.url ? (
              <p
                className="pt-1 text-red-700 text-sm font-medium leading-none"
                id="email-error"
              >
                {fetcher.data.errors.url}
              </p>
            ) : null}
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
                  fetcher.submit(
                    {
                      intent: "getLinks",
                      url: formRef.current?.url.value,
                    },
                    options,
                  );
                } else {
                  fetcher.submit(
                    {
                      intent: "scrapeLinks",
                      links: JSON.stringify([formRef.current?.url.value]),
                    },
                    options,
                  );
                }
              } else {
                fetcher.submit(
                  {
                    intent: "scrapeLinks",
                    links: JSON.stringify(selectedLinks),
                    crawled: true,
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
