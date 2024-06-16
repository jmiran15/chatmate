import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FileUploader } from "./file-uploader";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useParams, useFetcher, useActionData } from "@remix-run/react";
import { Badge } from "~/components/ui/badge";
import { STEPS } from "~/utils/types";

export function FileUpload({
  setStep,
  setOpen,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
}) {
  const { chatbotId } = useParams();
  const [files, setFiles] = useState<File[]>([]);
  const fetcher = useFetcher();
  const actionData = useActionData();

  console.log("actionData - ", actionData);

  const handleUpload = async () => {
    setOpen(false);
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
      <DialogFooter>
        <div className="w-full flex flex-row justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setStep(STEPS.SELECT_TYPE);
            }}
          >
            Back
          </Button>
          <Button onClick={handleUpload}>Next</Button>
        </div>
      </DialogFooter>
    </>
  );
}
