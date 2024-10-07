import { Clipboard, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import pkg from "react-copy-to-clipboard";
import { NonLinkCard } from "~/components/LinkCard";
import { LinkCardBody } from "~/components/LinkCardBody";
import { LinkCardHeader } from "~/components/LinkCardHeader";
import { Button } from "../../components/ui/button";
import { useToast } from "../../components/ui/use-toast";
const { CopyToClipboard } = pkg;

export default function CopyEmbedCode({ code }: { code: string }) {
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
    <NonLinkCard className="w-full max-w-2xl">
      <div className="p-4 flex flex-col gap-4 items-start justify-start">
        <div className="flex flex-col gap-1">
          <LinkCardHeader title={"JavaScript code snippet"} tag={undefined} />
          <LinkCardBody>
            <span>
              Embed this code snippet at the end of the body section of your
              website to display your chatbot as a floating icon.
            </span>
          </LinkCardBody>
        </div>
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold max-w-xl">
          {code}
        </code>
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
    </NonLinkCard>
  );
}
