import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { Button } from "./ui/button";
import nl2br from "react-newline-to-break";
import { useToast } from "./ui/use-toast";

export default function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    setCopied(true);
    toast({
      title: "Success",
      description: "Code copied to clipboard",
    });
    setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="bg-slate-800 p-4 rounded-md text-sm text-white">
        {nl2br(code)}
      </div>
      <CopyToClipboard text={code} onCopy={copy}>
        <Button variant="secondary" className="flex flex-row gap-2">
          Copy code
          {copied ? (
            <ClipboardCheck className="h-4 w-4" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
        </Button>
      </CopyToClipboard>
    </div>
  );
}
