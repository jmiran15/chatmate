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
  useFetchers,
  useParams,
  useSubmit,
} from "@remix-run/react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { STEPS } from "~/utils/types";
import { Checkbox } from "~/components/ui/checkbox";
import { useEventSource } from "remix-utils/sse/react";
import LinksTable from "./links-table";
import { Progress } from "../api.crawl.$jobId.progress";
import { createId } from "@paralleldrive/cuid2";

export default function Website({
  setStep,
  setOpen,
  submit,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
  submit: ReturnType<typeof useSubmit>;
}) {
  const { chatbotId } = useParams();
  const actionData = useActionData();
  const fetchers = useFetchers();

  const formRef = useRef<HTMLFormElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [isTableVisible, setIsTableVisible] = useState(false);
  const linksFetcherKey = useRef(createId());
  const scrapeFetcherKey = useRef(createId());
  const linksFetcher = fetchers.find(
    (fetcher) => fetcher.key === linksFetcherKey.current,
  );
  const scrapeFetcher = fetchers.find(
    (fetcher) => fetcher.key === scrapeFetcherKey.current,
  );
  const job = linksFetcher?.data?.job;
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

  // TODO - these are not optimistic - it is waiting for data
  useEffect(() => {
    if (!scrapeFetcher) return;
    if (!scrapeFetcher?.data?.errors) {
      setOpen(false);
    } else {
      if (scrapeFetcher?.data?.errors?.url) {
        urlRef.current?.focus();
      }
    }
  }, [scrapeFetcher]);

  useEffect(() => {
    if (!linksFetcher) return;
    if (!linksFetcher?.data?.errors) {
      setIsTableVisible(true);
    } else {
      if (linksFetcher?.data?.errors?.url) {
        urlRef.current?.focus();
      }
    }
  }, [linksFetcher]);

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
              aria-invalid={actionData?.errors?.url ? true : undefined}
              aria-describedby="url-error"
              id="url"
              type="url"
              placeholder="https://example.com"
              required
            />

            {actionData?.errors?.url ? (
              <p
                className="pt-1 text-red-700 text-sm font-medium leading-none"
                id="email-error"
              >
                {actionData.errors.url}
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
                linksFetcherKey.current = createId();
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
                navigate: false,
              } as SubmitOptions;

              // the formRef is rendered
              if (formRef.current) {
                if (formRef.current.crawl["1"].checked) {
                  submit(
                    {
                      intent: "getLinks",
                      url: formRef.current?.url.value,
                    },
                    { ...options, fetcherKey: linksFetcherKey.current },
                  );
                } else {
                  submit(
                    {
                      intent: "scrapeLinks",
                      links: JSON.stringify([
                        { id: createId(), url: formRef.current?.url.value },
                      ]),
                    },
                    { ...options, fetcherKey: scrapeFetcherKey.current },
                  );
                }
              } else {
                submit(
                  {
                    intent: "scrapeLinks",
                    links: JSON.stringify(
                      selectedLinks.map((link) => ({
                        id: createId(),
                        url: link,
                      })),
                    ),
                    crawled: true,
                  },
                  { ...options, fetcherKey: scrapeFetcherKey.current },
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
