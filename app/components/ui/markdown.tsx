import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import React, { RefObject, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import RehypeHighlight from "rehype-highlight";
import RehypeKatex from "rehype-katex";
import RemarkBreaks from "remark-breaks";
import RemarkGfm from "remark-gfm";
import RemarkMath from "remark-math";
import { copyToClipboard } from "~/utils/clipboard";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { useDebouncedCallback } from "use-debounce";
import { Loading } from "~/components/ui/loading";

export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error("[Mermaid] ", e.message);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.code]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: "image/svg+xml" });
    setImageUrl(URL.createObjectURL(blob));
  }

  if (hasError) {
    return null;
  }

  return (
    <Dialog open={!!imageUrl}>
      <DialogTrigger asChild>
        <div
          className="no-dark mermaid"
          style={{
            cursor: "pointer",
            overflow: "auto",
          }}
          ref={ref}
          onClick={() => viewSvgInNewWindow()}
        >
          {props.code}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Long press or right click to save image</DialogTitle>
        </DialogHeader>
        <div>
          <img src={imageUrl} alt="preview" className="max-w-full" />
        </div>
        <Separator />
      </DialogContent>
    </Dialog>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PreCode(props: { children: any }) {
  const { toast } = useToast();
  const ref = useRef<HTMLPreElement>(null);
  const refText = ref.current?.innerText;
  const [mermaidCode, setMermaidCode] = useState("");

  const renderMermaid = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector("code.language-mermaid");
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }
  }, 600);

  useEffect(() => {
    setTimeout(renderMermaid, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refText]);

  return (
    <>
      {/* eslint-disable-next-line react/jsx-no-leaked-render */}
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      <pre ref={ref} className="group relative">
        <span
          className="copy-code-button group-hover:translate-x-0 group-hover:opacity-100 group-hover:pointer-events-auto"
          onClick={() => {
            if (ref.current) {
              const code = ref.current.innerText;
              copyToClipboard(code, toast);
            }
          }}
        ></span>
        {props.children}
      </pre>
    </>
  );
}

function _MarkDownContent(props: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={[
        RehypeKatex,
        [
          RehypeHighlight,
          {
            detect: false,
            ignoreMissing: true,
          },
        ],
      ]}
      components={{
        pre: PreCode,
        p: (pProps) => <p {...pProps} dir="auto" />,
        a: (aProps) => {
          const href = aProps.href || "";
          const isInternal = /^\/#/i.test(href);
          const target = isInternal ? "_self" : aProps.target ?? "_blank";
          // eslint-disable-next-line jsx-a11y/anchor-has-content
          return <a {...aProps} target={target} />;
        },
      }}
    >
      {props.content}
    </ReactMarkdown>
  );
}

export const MarkdownContent = React.memo(_MarkDownContent);

export default function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    parentRef?: RefObject<HTMLDivElement>;
    defaultShow?: boolean;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);

  console.log("loading", props.loading);
  return (
    <div
      className="markdown-body"
      style={{
        fontSize: `${props.fontSize ?? 14}px`,
      }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
    >
      {props.loading ? (
        <Loading />
      ) : (
        <MarkdownContent content={props.content} />
      )}
    </div>
  );
}
