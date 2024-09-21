import mdx from "@mdx-js/rollup";
import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import rehypePrettyCode from "rehype-pretty-code";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig({
  server: {
    port: 3000,
    warmup: {
      clientFiles: [
        "./app/entry.client.tsx",
        "./app/root.tsx",
        "./app/routes/**/*",
      ],
    },
  },
  optimizeDeps: {
    include: ["./app/routes/**/*"],
  },
  resolve: {
    alias: {
      ".prisma/client/index-browser":
        "./node_modules/.prisma/client/index-browser.js",
    },
  },
  plugins: [
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
      rehypePlugins: [rehypePrettyCode],
    }),
    wasm(),
    topLevelAwait(),
    envOnlyMacros(),
    remix({
      ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{ts,tsx}"],
      future: {
        v3_fetcherPersist: true,

        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
});
