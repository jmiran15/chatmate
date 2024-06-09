import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FileUploader } from "./file-uploader";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { useParams, useFetcher } from "@remix-run/react";
import { Badge } from "~/components/ui/badge";

export function FileUpload() {
  const { chatbotId } = useParams();
  const [files, setFiles] = useState<File[]>([]);
  const fetcher = useFetcher();

  console.log("file.tsx - ", files);

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("intent", "parseFiles");

    fetcher.submit(formData, {
      method: "post",
      action: `/chatbots/${chatbotId}/data?index`,
      encType: "multipart/form-data",
    });
  };

  useEffect(() => {
    console.log("file.tsx - fetcher", fetcher);

    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      fetcher.data.intent === "parseFiles"
    ) {
      console.log("file.tsx - fetcher.data", fetcher.data);
      fetcher.submit(
        {
          intent: "createDocuments",
          documents: JSON.stringify(fetcher.data.documents),
        },
        {
          method: "post",
          action: `/chatbots/${chatbotId}/data?index`,
        },
      );
    }
  }, [fetcher]);

  const SUPPORTED_FILE_TYPES = [
    "txt",
    "eml",
    "msg",
    "xml",
    "html",
    "md",
    "rst",
    "json",
    "rtf",
    "jpeg",
    "png",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "pdf",
    "odt",
    "epub",
    "csv",
    "tsv",
    "xlsx",
    "gz",
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload files</DialogTitle>
        <DialogDescription>
          Drag and drop your files here or click to browse.
        </DialogDescription>
      </DialogHeader>
      <FileUploader
        maxFiles={8}
        maxSize={8 * 1024 * 1024}
        onValueChange={setFiles}
      />
      <div className="flex flex-row gap-1 flex-wrap">
        <span className="text-sm font-normal text-gray-700">
          Supported file types:
        </span>
        {SUPPORTED_FILE_TYPES.map((fileType, index) => (
          <Badge key={index} variant="secondary">
            {fileType}
          </Badge>
        ))}
      </div>
      <DialogFooter className="w-full flex justify-between">
        <Button variant="ghost">Back</Button>
        <Button onClick={handleUpload} disabled={fetcher.state !== "idle"}>
          {fetcher.state === "submitting" ? "Uploading..." : "Upload"}
        </Button>
      </DialogFooter>
    </>
  );
}
