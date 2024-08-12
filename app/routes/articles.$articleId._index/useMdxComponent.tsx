import * as runtime from "react/jsx-runtime";
import { useMemo } from "react";
import { evaluateSync } from "@mdx-js/mdx";
import type { RunOptions } from "@mdx-js/mdx";

export function useMdxComponent(code: string) {
  return useMemo(() => {
    const { default: MDXComponent } = evaluateSync(code, {
      ...(runtime as RunOptions),
      development: false,
    });
    return MDXComponent;
  }, [code]);
}
