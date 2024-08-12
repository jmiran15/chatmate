import { useRef, useEffect, useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { CardContent } from "~/components/ui/card";
import { TableOfContents } from "./table-of-contents";
import { loader } from "./route.mdx";
import { useMdxComponent } from "./useMdxComponent";
import pkg from "react-copy-to-clipboard";
const { CopyToClipboard } = pkg;
import { Button } from "~/components/ui/button";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { useToast } from "~/components/ui/use-toast";

export function BlogPost() {
  const { article } = useLoaderData<typeof loader>();
  const contentRef = useRef<HTMLDivElement>(null);
  const { markdownContent } = article;
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  console.log(
    "products",
    article.products
      ?.map(
        (product) =>
          `Product url: ${product.baseUrl}\nProduct position: ${
            product.position
          }\nProduct screenshot: ${
            product.screenshot
          }\Product information: ${JSON.stringify(
            JSON.parse(product.extractedProductInfo),
            null,
            2,
          )}`,
      )
      .join("\n\n"),
  );

  const MDXContent = useMdxComponent(markdownContent || "");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      window.dispatchEvent(new CustomEvent("contentUpdated"));
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  const handleCopy = () => {
    setCopied(true);
    toast({
      title: "Success",
      description: "Content copied to clipboard",
    });
    setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  return (
    <div className="flex gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
      <aside className="w-64 hidden lg:block">
        <div className="sticky top-8">
          <TableOfContents />
        </div>
      </aside>
      <article className="flex-1 max-w-2xl mx-auto my-8">
        <div className="mb-4">
          <CopyToClipboard text={markdownContent || ""} onCopy={handleCopy}>
            <Button variant="secondary" className="flex flex-row gap-2">
              {copied ? "Copied!" : "Copy content"}
              {copied ? (
                <ClipboardCheck className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
            </Button>
          </CopyToClipboard>
        </div>
        <div ref={contentRef} className="prose w-full">
          <MDXContent />
        </div>
      </article>
    </div>
  );
}
