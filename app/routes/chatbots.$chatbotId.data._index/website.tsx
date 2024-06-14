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
import { useRef, useState } from "react";

import { Document, STEPS } from "~/utils/types";
import { Checkbox } from "~/components/ui/checkbox";
import { v4 as uuidv4 } from "uuid";
import { useEventSource } from "remix-utils/sse/react";
import LinksTable from "./links-table";

export default function Website({
  setStep,
  setOpen,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
}) {
  const navigation = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();
  const { chatbotId } = useParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [isTableVisible, setIsTableVisible] = useState(false);
  const job = actionData?.job;
  const completionEvent = useEventSource(`/jobs/${job?.id}/progress/crawl`, {
    event: "completed",
  });
  console.log("website.tsx - completionEvent", completionEvent);
  const links = completionEvent ? JSON.parse(completionEvent) : [];
  const disableNextButton = navigation.state === "submitting";

  // useEffect(() => {
  //   console.log("actionData", actionData);

  //   // we are going to optimistically show the data table.

  //   if (showDataTable) {
  //     setLinks(actionData.links);
  //   } else if (canSubmit) {
  //     console.log("website.tsx - creating documents", actionData.documents);
  //     submit(
  //       {
  //         intent: "createDocuments",
  //         // can probly clean up this logic to just use Prisma Document type all throughout
  //         documents: JSON.stringify(
  //           actionData.documents.map((d) => ({
  //             name: d.metadata.sourceURL,
  //             content: d.content,
  //             type: DocumentType.WEBSITE,
  //             chatbotId,
  //           })),
  //         ),
  //       },
  //       {
  //         method: "post",
  //         action: `/chatbots/${chatbotId}/data?index`,
  //       },
  //     );
  //   }
  // }, [actionData]);

  const selectedLinks =
    links?.length > 0
      ? Object.keys(rowSelection).map((index) => links[index as number])
      : [];

  console.log("website.tsx - selectedLinks", selectedLinks);

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
                action: `/chatbots/${chatbotId}/data?index&step=data&type=website`,
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

                  // call "createDocuments" instead of crawl - crawl inside the createDocuments api

                  submit(
                    {
                      intent: "scrapeLinks",
                      links: JSON.stringify([formRef.current?.url.value]),
                    },
                    options,
                  );
                }
              } else {
                // call "createDocuments" instead of crawl - crawl inside the createDocuments api
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
