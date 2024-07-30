import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useToast } from "../../components/ui/use-toast";

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
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>JavaScript code snippet</CardTitle>
        <CardDescription>
          Embed this code snippet at the end of the body section of your website
          to display your chatbot as a floating icon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold max-w-xl">
          {code}
        </code>
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
}
