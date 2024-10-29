import { createId } from "@paralleldrive/cuid2";
import {
  Form,
  SubmitOptions,
  useFetchers,
  useParams,
  useSubmit,
} from "@remix-run/react";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEventSource } from "remix-utils/sse/react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { validateUrl } from "~/utils";
import { STEPS } from "~/utils/types";
import { Progress } from "../../api.crawl.$jobId.progress";
import LinksTable from "./links-table";

export default function Website({
  setStep,
  setOpen,
  submit,
  revisionForMessageId,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
  submit: ReturnType<typeof useSubmit>;
  revisionForMessageId?: string;
}) {
  const { chatbotId } = useParams();
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
  const [jobInfo, setJobInfo] = useState<{ id: string } | null>(null);

  // Use a callback to update jobInfo when linksFetcher data changes
  const updateJobInfo = useCallback((data: any) => {
    if (data?.job?.id) {
      setJobInfo({ id: data.job.id });
    }
  }, []);

  // Update jobInfo when linksFetcher data changes
  useEffect(() => {
    if (linksFetcher?.data) {
      updateJobInfo(linksFetcher.data);
    }
  }, [linksFetcher?.data, updateJobInfo]);

  // Use jobInfo for the event source URL
  const eventSource: string | null = useEventSource(
    `/api/crawl/${jobInfo?.id}/progress`,
  );

  console.log("Job: ", jobInfo, eventSource);

  const progress: Progress | undefined = useMemo(() => {
    return eventSource ? JSON.parse(eventSource) : undefined;
  }, [eventSource]);
  const selectedLinks =
    links?.length > 0
      ? Object.keys(rowSelection).map((index) => links[Number(index)])
      : [];
  const disableNextButton =
    isTableVisible && (links.length === 0 || selectedLinks.length === 0);

  const [urlError, setUrlError] = useState<string | null>(null);

  // crawl progress
  // TODO - lots of unneeded re-renders here - causing performance issues
  useEffect(() => {
    if (jobInfo?.id !== progress?.jobId) {
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
  }, [
    progress?.progress?.currentDocumentUrl,
    progress?.returnvalue,
    jobInfo?.id,
  ]);

  function handleSubmit(url: string, intent: "scrape" | "links") {
    const isValid = validateUrl(url);
    if (!isValid) {
      setUrlError("Url is invalid");
      urlRef.current?.focus();
    } else {
      setUrlError(null);
      const options = {
        method: "post",
        action: `/chatbots/${chatbotId}/data?index`,
        navigate: false,
      } as SubmitOptions;

      if (intent === "scrape") {
        setOpen(false);
        submit(
          {
            intent: "scrapeLinks",
            links: JSON.stringify([
              { id: createId(), url: formRef.current?.url.value },
            ]),
            ...(revisionForMessageId ? { revisionForMessageId } : {}),
          },
          {
            ...options,
            fetcherKey: scrapeFetcherKey.current,
          },
        );
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else if (intent === "links") {
        setIsTableVisible(true);
        setJobInfo(null); // Reset jobInfo before starting a new job
        submit(
          {
            intent: "getLinks",
            url: formRef.current?.url.value,
          },
          { ...options, fetcherKey: linksFetcherKey.current },
        );
      }
    }
  }

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
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={true}
              name="url"
              autoComplete="url"
              aria-invalid={urlError ? true : undefined}
              aria-describedby="url-error"
              id="url"
              type="url"
              placeholder="https://example.com"
              required
            />

            {urlError ? (
              <p
                className="pt-1 text-red-500 text-sm font-medium leading-none"
                id="url-error"
              >
                {urlError}
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
                  handleSubmit(formRef.current?.url.value, "links");
                } else {
                  handleSubmit(formRef.current?.url.value, "scrape");
                }
              } else {
                setOpen(false);
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
                    ...(revisionForMessageId ? { revisionForMessageId } : {}),
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
