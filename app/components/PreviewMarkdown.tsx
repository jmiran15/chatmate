import type { EvaluateOptions } from "@mdx-js/mdx";
import { evaluateSync } from "@mdx-js/mdx";
import type { MDXComponents, MDXProps } from "mdx/types";
import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

type ReactMDXContent = (props: MDXProps) => ReactNode;
type Runtime = Pick<EvaluateOptions, "jsx" | "jsxs" | "Fragment">;

const runtime = { jsx, jsxs, Fragment } as Runtime;

const components: MDXComponents = {};

export const PreviewMarkdown: FC<{ source?: string }> = ({ source = "" }) => {
  const [MdxContent, setMdxContent] = useState<ReactMDXContent>(
    () => () => null,
  );

  useEffect(() => {
    try {
      const r = evaluateSync(source, runtime);
      setMdxContent(() => r.default as ReactMDXContent);
    } catch (error) {
      console.error("Error evaluating MDX:", error);
      setMdxContent(() => () => <div>Error rendering markdown</div>);
    }
  }, [source]);

  return <MdxContent components={components} />;
};
