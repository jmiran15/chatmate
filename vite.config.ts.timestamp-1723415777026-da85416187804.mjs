// vite.config.ts
import { vitePlugin as remix } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/@remix-run/dev/dist/index.js";
import { installGlobals } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/@remix-run/node/dist/index.js";
import tsconfigPaths from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { defineConfig } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite/dist/node/index.js";
import { envOnlyMacros } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-env-only/dist/index.js";
import mdx from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/@mdx-js/rollup/index.js";
import remarkFrontmatter from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/remark-frontmatter/index.js";
import remarkMdxFrontmatter from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/remark-mdx-frontmatter/dist/remark-mdx-frontmatter.js";
import rehypePrettyCode from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/rehype-pretty-code/dist/index.js";
import wasm from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-plugin-wasm/exports/import.mjs";
import topLevelAwait from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-plugin-top-level-await/exports/import.mjs";
installGlobals();
var vite_config_default = defineConfig({
  server: {
    port: 3e3,
    warmup: {
      clientFiles: [
        "./app/entry.client.tsx",
        "./app/root.tsx",
        "./app/routes/**/*"
      ]
    }
  },
  optimizeDeps: {
    include: ["./app/routes/**/*"]
  },
  resolve: {
    alias: {
      ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js"
    }
  },
  plugins: [
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      rehypePlugins: [rehypePrettyCode]
    }),
    wasm(),
    topLevelAwait(),
    envOnlyMacros(),
    remix({
      ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{ts,tsx}"],
      future: {
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true
      }
    }),
    tsconfigPaths()
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvam9uYXRoYW5taXJhbmRhL0Rlc2t0b3AvY2hhdG1hdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qb25hdGhhbm1pcmFuZGEvRGVza3RvcC9jaGF0bWF0ZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvam9uYXRoYW5taXJhbmRhL0Rlc2t0b3AvY2hhdG1hdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB2aXRlUGx1Z2luIGFzIHJlbWl4IH0gZnJvbSBcIkByZW1peC1ydW4vZGV2XCI7XG5pbXBvcnQgeyBpbnN0YWxsR2xvYmFscyB9IGZyb20gXCJAcmVtaXgtcnVuL25vZGVcIjtcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgZW52T25seU1hY3JvcyB9IGZyb20gXCJ2aXRlLWVudi1vbmx5XCI7XG5pbXBvcnQgbWR4IGZyb20gXCJAbWR4LWpzL3JvbGx1cFwiO1xuaW1wb3J0IHJlbWFya0Zyb250bWF0dGVyIGZyb20gXCJyZW1hcmstZnJvbnRtYXR0ZXJcIjtcbmltcG9ydCByZW1hcmtNZHhGcm9udG1hdHRlciBmcm9tIFwicmVtYXJrLW1keC1mcm9udG1hdHRlclwiO1xuaW1wb3J0IHJlaHlwZVByZXR0eUNvZGUgZnJvbSBcInJlaHlwZS1wcmV0dHktY29kZVwiO1xuaW1wb3J0IHdhc20gZnJvbSBcInZpdGUtcGx1Z2luLXdhc21cIjtcbmltcG9ydCB0b3BMZXZlbEF3YWl0IGZyb20gXCJ2aXRlLXBsdWdpbi10b3AtbGV2ZWwtYXdhaXRcIjtcblxuaW5zdGFsbEdsb2JhbHMoKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICB3YXJtdXA6IHtcbiAgICAgIGNsaWVudEZpbGVzOiBbXG4gICAgICAgIFwiLi9hcHAvZW50cnkuY2xpZW50LnRzeFwiLFxuICAgICAgICBcIi4vYXBwL3Jvb3QudHN4XCIsXG4gICAgICAgIFwiLi9hcHAvcm91dGVzLyoqLypcIixcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1wiLi9hcHAvcm91dGVzLyoqLypcIl0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCIucHJpc21hL2NsaWVudC9pbmRleC1icm93c2VyXCI6XG4gICAgICAgIFwiLi9ub2RlX21vZHVsZXMvLnByaXNtYS9jbGllbnQvaW5kZXgtYnJvd3Nlci5qc1wiLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBtZHgoe1xuICAgICAgcmVtYXJrUGx1Z2luczogW3JlbWFya0Zyb250bWF0dGVyLCByZW1hcmtNZHhGcm9udG1hdHRlcl0sXG4gICAgICByZWh5cGVQbHVnaW5zOiBbcmVoeXBlUHJldHR5Q29kZV0sXG4gICAgfSksXG4gICAgd2FzbSgpLFxuICAgIHRvcExldmVsQXdhaXQoKSxcbiAgICBlbnZPbmx5TWFjcm9zKCksXG4gICAgcmVtaXgoe1xuICAgICAgaWdub3JlZFJvdXRlRmlsZXM6IFtcIioqLy4qXCIsIFwiKiovKi5jc3NcIiwgXCIqKi8qLnRlc3Que3RzLHRzeH1cIl0sXG4gICAgICBmdXR1cmU6IHtcbiAgICAgICAgdjNfcmVsYXRpdmVTcGxhdFBhdGg6IHRydWUsXG4gICAgICAgIHYzX3Rocm93QWJvcnRSZWFzb246IHRydWUsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIHRzY29uZmlnUGF0aHMoKSxcbiAgXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1UyxTQUFTLGNBQWMsYUFBYTtBQUMzVSxTQUFTLHNCQUFzQjtBQUMvQixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHFCQUFxQjtBQUM5QixPQUFPLFNBQVM7QUFDaEIsT0FBTyx1QkFBdUI7QUFDOUIsT0FBTywwQkFBMEI7QUFDakMsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sbUJBQW1CO0FBRTFCLGVBQWU7QUFFZixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDTixhQUFhO0FBQUEsUUFDWDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsbUJBQW1CO0FBQUEsRUFDL0I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLGdDQUNFO0FBQUEsSUFDSjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxNQUNGLGVBQWUsQ0FBQyxtQkFBbUIsb0JBQW9CO0FBQUEsTUFDdkQsZUFBZSxDQUFDLGdCQUFnQjtBQUFBLElBQ2xDLENBQUM7QUFBQSxJQUNELEtBQUs7QUFBQSxJQUNMLGNBQWM7QUFBQSxJQUNkLGNBQWM7QUFBQSxJQUNkLE1BQU07QUFBQSxNQUNKLG1CQUFtQixDQUFDLFNBQVMsWUFBWSxvQkFBb0I7QUFBQSxNQUM3RCxRQUFRO0FBQUEsUUFDTixzQkFBc0I7QUFBQSxRQUN0QixxQkFBcUI7QUFBQSxNQUN2QjtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsY0FBYztBQUFBLEVBQ2hCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
