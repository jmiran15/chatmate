// vite.config.ts
import mdx from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/@mdx-js/rollup/index.js";
import { vitePlugin as remix } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/@remix-run/dev/dist/index.js";
import { installGlobals } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/@remix-run/node/dist/index.js";
import rehypePrettyCode from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/rehype-pretty-code/dist/index.js";
import remarkFrontmatter from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/remark-frontmatter/index.js";
import remarkGfm from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/remark-gfm/index.js";
import remarkMdxFrontmatter from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/remark-mdx-frontmatter/dist/remark-mdx-frontmatter.js";
import { defineConfig } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite/dist/node/index.js";
import { envOnlyMacros } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-env-only/dist/index.js";
import topLevelAwait from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-plugin-top-level-await/exports/import.mjs";
import wasm from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-plugin-wasm/exports/import.mjs";
import tsconfigPaths from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-tsconfig-paths/dist/index.mjs";
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
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
      rehypePlugins: [rehypePrettyCode]
    }),
    wasm(),
    topLevelAwait(),
    envOnlyMacros(),
    remix({
      ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{ts,tsx}"],
      future: {
        // v3_fetcherPersist: true, TODO: Need to refactor lots of our useFetcher usage to support this!
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvam9uYXRoYW5taXJhbmRhL0Rlc2t0b3AvY2hhdG1hdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qb25hdGhhbm1pcmFuZGEvRGVza3RvcC9jaGF0bWF0ZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvam9uYXRoYW5taXJhbmRhL0Rlc2t0b3AvY2hhdG1hdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgbWR4IGZyb20gXCJAbWR4LWpzL3JvbGx1cFwiO1xuaW1wb3J0IHsgdml0ZVBsdWdpbiBhcyByZW1peCB9IGZyb20gXCJAcmVtaXgtcnVuL2RldlwiO1xuaW1wb3J0IHsgaW5zdGFsbEdsb2JhbHMgfSBmcm9tIFwiQHJlbWl4LXJ1bi9ub2RlXCI7XG5pbXBvcnQgcmVoeXBlUHJldHR5Q29kZSBmcm9tIFwicmVoeXBlLXByZXR0eS1jb2RlXCI7XG5pbXBvcnQgcmVtYXJrRnJvbnRtYXR0ZXIgZnJvbSBcInJlbWFyay1mcm9udG1hdHRlclwiO1xuaW1wb3J0IHJlbWFya0dmbSBmcm9tIFwicmVtYXJrLWdmbVwiO1xuaW1wb3J0IHJlbWFya01keEZyb250bWF0dGVyIGZyb20gXCJyZW1hcmstbWR4LWZyb250bWF0dGVyXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgZW52T25seU1hY3JvcyB9IGZyb20gXCJ2aXRlLWVudi1vbmx5XCI7XG5pbXBvcnQgdG9wTGV2ZWxBd2FpdCBmcm9tIFwidml0ZS1wbHVnaW4tdG9wLWxldmVsLWF3YWl0XCI7XG5pbXBvcnQgd2FzbSBmcm9tIFwidml0ZS1wbHVnaW4td2FzbVwiO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSBcInZpdGUtdHNjb25maWctcGF0aHNcIjtcblxuaW5zdGFsbEdsb2JhbHMoKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICB3YXJtdXA6IHtcbiAgICAgIGNsaWVudEZpbGVzOiBbXG4gICAgICAgIFwiLi9hcHAvZW50cnkuY2xpZW50LnRzeFwiLFxuICAgICAgICBcIi4vYXBwL3Jvb3QudHN4XCIsXG4gICAgICAgIFwiLi9hcHAvcm91dGVzLyoqLypcIixcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1wiLi9hcHAvcm91dGVzLyoqLypcIl0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCIucHJpc21hL2NsaWVudC9pbmRleC1icm93c2VyXCI6XG4gICAgICAgIFwiLi9ub2RlX21vZHVsZXMvLnByaXNtYS9jbGllbnQvaW5kZXgtYnJvd3Nlci5qc1wiLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBtZHgoe1xuICAgICAgcmVtYXJrUGx1Z2luczogW3JlbWFya0Zyb250bWF0dGVyLCByZW1hcmtNZHhGcm9udG1hdHRlciwgcmVtYXJrR2ZtXSxcbiAgICAgIHJlaHlwZVBsdWdpbnM6IFtyZWh5cGVQcmV0dHlDb2RlXSxcbiAgICB9KSxcbiAgICB3YXNtKCksXG4gICAgdG9wTGV2ZWxBd2FpdCgpLFxuICAgIGVudk9ubHlNYWNyb3MoKSxcbiAgICByZW1peCh7XG4gICAgICBpZ25vcmVkUm91dGVGaWxlczogW1wiKiovLipcIiwgXCIqKi8qLmNzc1wiLCBcIioqLyoudGVzdC57dHMsdHN4fVwiXSxcbiAgICAgIGZ1dHVyZToge1xuICAgICAgICAvLyB2M19mZXRjaGVyUGVyc2lzdDogdHJ1ZSwgVE9ETzogTmVlZCB0byByZWZhY3RvciBsb3RzIG9mIG91ciB1c2VGZXRjaGVyIHVzYWdlIHRvIHN1cHBvcnQgdGhpcyFcbiAgICAgICAgdjNfcmVsYXRpdmVTcGxhdFBhdGg6IHRydWUsXG4gICAgICAgIHYzX3Rocm93QWJvcnRSZWFzb246IHRydWUsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIHRzY29uZmlnUGF0aHMoKSxcbiAgXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1UyxPQUFPLFNBQVM7QUFDdlQsU0FBUyxjQUFjLGFBQWE7QUFDcEMsU0FBUyxzQkFBc0I7QUFDL0IsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyx1QkFBdUI7QUFDOUIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sMEJBQTBCO0FBQ2pDLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sVUFBVTtBQUNqQixPQUFPLG1CQUFtQjtBQUUxQixlQUFlO0FBRWYsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sYUFBYTtBQUFBLFFBQ1g7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLG1CQUFtQjtBQUFBLEVBQy9CO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxnQ0FDRTtBQUFBLElBQ0o7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixlQUFlLENBQUMsbUJBQW1CLHNCQUFzQixTQUFTO0FBQUEsTUFDbEUsZUFBZSxDQUFDLGdCQUFnQjtBQUFBLElBQ2xDLENBQUM7QUFBQSxJQUNELEtBQUs7QUFBQSxJQUNMLGNBQWM7QUFBQSxJQUNkLGNBQWM7QUFBQSxJQUNkLE1BQU07QUFBQSxNQUNKLG1CQUFtQixDQUFDLFNBQVMsWUFBWSxvQkFBb0I7QUFBQSxNQUM3RCxRQUFRO0FBQUE7QUFBQSxRQUVOLHNCQUFzQjtBQUFBLFFBQ3RCLHFCQUFxQjtBQUFBLE1BQ3ZCO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxjQUFjO0FBQUEsRUFDaEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=