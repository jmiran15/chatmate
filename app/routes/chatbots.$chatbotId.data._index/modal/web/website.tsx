import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  useActionData,
  useNavigation,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { DataTable } from "../../table/table";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { urlSchema } from "../../table/types";
import { columns } from "../../table/columns";
import { Document } from "~/utils/types";

export default function Website() {
  const navigation = useNavigation();
  const [rowSelection, setRowSelection] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const { chatbotId } = useParams();
  const pending =
    (navigation.state === "submitting" &&
      navigation.formData?.get("intent") === "getLinks") ||
    navigation.formData?.get("intent") === "createDocuments" ||
    navigation.formData?.get("intent") === "crawlLinks";
  const actionData = useActionData();
  const [links, setLinks] = useState<Document[]>([]);
  const showDataTable =
    actionData?.intent === "getLinks" && actionData?.links.length > 0; // we got links back
  const canSubmit =
    actionData?.intent === "crawlLinks" && actionData?.documents.length > 0; // we got documents back
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  useEffect(() => {
    console.log("actionData", actionData);
    if (showDataTable) {
      setLinks(actionData.links);
    } else if (canSubmit) {
      console.log("website.tsx - creating documents", actionData.documents);
      submit(
        {
          intent: "createDocuments",
          documents: JSON.stringify(
            actionData.documents.map((d) => ({
              name: d.metadata.sourceURL,
              content: d.content,
              chatbotId,
            })),
          ),
        },
        {
          method: "post",
          action: `/chatbots/${chatbotId}/data?index`,
        },
      );
    }
  }, [actionData]);

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

      {showDataTable ? (
        <DataTable
          data={z.array(urlSchema).parse(
            links.map((link) => ({
              url: link.metadata.sourceURL,
            })),
          )}
          columns={columns}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      ) : (
        <Form className="grid gap-4" method="post" ref={formRef}>
          <input type="hidden" name="intent" value="getLinks" />
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
        </Form>
      )}
      <DialogFooter>
        <div className="w-full flex flex-row justify-between">
          <Button
            variant="ghost"
            onClick={() =>
              setSearchParams({
                step: "type",
              })
            }
          >
            Back
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              submit(
                showDataTable
                  ? {
                      intent: "crawlLinks",
                      links: JSON.stringify(selectedLinks),
                    }
                  : {
                      intent: "getLinks",
                      url: formRef.current?.url.value,
                    },
                {
                  method: "post",
                  action: `/chatbots/${chatbotId}/data?index&step=data&type=website`,
                },
              )
            }
          >
            Next
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
