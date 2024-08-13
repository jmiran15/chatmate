import { useRef, useEffect } from "react";
import { TableOfContents } from "./TOC";
import * as runtime from "react/jsx-runtime";
import { useMemo } from "react";
import { evaluateSync } from "@mdx-js/mdx";
import type { RunOptions } from "@mdx-js/mdx";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { TableWrapper } from "./TableWrapper";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "@remix-run/react";
import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  table: TableWrapper,
  thead: TableHeader,
  tbody: TableBody,
  tr: TableRow,
  th: TableHead,
  td: TableCell,
};

export function useMdxComponent(code: string) {
  return useMemo(() => {
    const { default: MDXComponent } = evaluateSync(code, {
      ...(runtime as RunOptions),
      development: false,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeStringify],
    });
    return MDXComponent;
  }, [code]);
}

export function PostWrapper({
  content,
  published,
  title,
  image,
  description,
}: {
  content: string;
  published: string;
  title: string;
  image: string;
  description: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  const MDXContent = useMdxComponent(content);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      window.dispatchEvent(new CustomEvent("contentUpdated"));
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-8 w-full justify-start mb-16 max-w-full">
      <aside className="w-full sm:w-64 sm:sticky sm:top-8 sm:self-start sm:max-h-[calc(100vh-2rem)] overflow-y-auto">
        <TableOfContents />
      </aside>
      <article className="flex-1 w-full max-w-3xl overflow-x-hidden">
        <div ref={contentRef} className="prose dark:prose-invert w-full">
          <h1 className="text-4xl font-bold">{title}</h1>
          <time className="text-sm text-muted-foreground" dateTime={published}>
            {new Date(published).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <div className="relative w-full aspect-video mb-8">
            <img
              src={image}
              alt={title}
              className="object-cover w-full h-full rounded-lg shadow-md"
            />
          </div>
          <p className="text-lg text-muted-foreground mb-8">{description}</p>
          <MDXContent components={components} />
          <Card className="bg-orange-100 dark:bg-orange-900 rounded-lg shadow-md">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
              <p className="mb-4">
                Sign up now and experience the power of our service!
              </p>
              <Button asChild>
                <Link to="/join">Sign Up Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </article>
    </div>
  );
}
