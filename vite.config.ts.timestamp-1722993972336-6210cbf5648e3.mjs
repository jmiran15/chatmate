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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvam9uYXRoYW5taXJhbmRhL0Rlc2t0b3AvY2hhdG1hdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qb25hdGhhbm1pcmFuZGEvRGVza3RvcC9jaGF0bWF0ZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvam9uYXRoYW5taXJhbmRhL0Rlc2t0b3AvY2hhdG1hdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB2aXRlUGx1Z2luIGFzIHJlbWl4IH0gZnJvbSBcIkByZW1peC1ydW4vZGV2XCI7XG5pbXBvcnQgeyBpbnN0YWxsR2xvYmFscyB9IGZyb20gXCJAcmVtaXgtcnVuL25vZGVcIjtcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgZW52T25seU1hY3JvcyB9IGZyb20gXCJ2aXRlLWVudi1vbmx5XCI7XG5pbXBvcnQgbWR4IGZyb20gXCJAbWR4LWpzL3JvbGx1cFwiO1xuaW1wb3J0IHJlbWFya0Zyb250bWF0dGVyIGZyb20gXCJyZW1hcmstZnJvbnRtYXR0ZXJcIjtcbmltcG9ydCByZW1hcmtNZHhGcm9udG1hdHRlciBmcm9tIFwicmVtYXJrLW1keC1mcm9udG1hdHRlclwiO1xuaW1wb3J0IHJlaHlwZVByZXR0eUNvZGUgZnJvbSBcInJlaHlwZS1wcmV0dHktY29kZVwiO1xuXG5pbnN0YWxsR2xvYmFscygpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIHdhcm11cDoge1xuICAgICAgY2xpZW50RmlsZXM6IFtcbiAgICAgICAgXCIuL2FwcC9lbnRyeS5jbGllbnQudHN4XCIsXG4gICAgICAgIFwiLi9hcHAvcm9vdC50c3hcIixcbiAgICAgICAgXCIuL2FwcC9yb3V0ZXMvKiovKlwiLFxuICAgICAgXSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXCIuL2FwcC9yb3V0ZXMvKiovKlwiXSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIi5wcmlzbWEvY2xpZW50L2luZGV4LWJyb3dzZXJcIjpcbiAgICAgICAgXCIuL25vZGVfbW9kdWxlcy8ucHJpc21hL2NsaWVudC9pbmRleC1icm93c2VyLmpzXCIsXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIG1keCh7XG4gICAgICByZW1hcmtQbHVnaW5zOiBbcmVtYXJrRnJvbnRtYXR0ZXIsIHJlbWFya01keEZyb250bWF0dGVyXSxcbiAgICAgIHJlaHlwZVBsdWdpbnM6IFtyZWh5cGVQcmV0dHlDb2RlXSxcbiAgICB9KSxcbiAgICBlbnZPbmx5TWFjcm9zKCksXG4gICAgcmVtaXgoe1xuICAgICAgaWdub3JlZFJvdXRlRmlsZXM6IFtcIioqLy4qXCIsIFwiKiovKi5jc3NcIiwgXCIqKi8qLnRlc3Que3RzLHRzeH1cIl0sXG4gICAgICBmdXR1cmU6IHtcbiAgICAgICAgdjNfcmVsYXRpdmVTcGxhdFBhdGg6IHRydWUsXG4gICAgICAgIHYzX3Rocm93QWJvcnRSZWFzb246IHRydWUsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIHRzY29uZmlnUGF0aHMoKSxcbiAgXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1UyxTQUFTLGNBQWMsYUFBYTtBQUMzVSxTQUFTLHNCQUFzQjtBQUMvQixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHFCQUFxQjtBQUM5QixPQUFPLFNBQVM7QUFDaEIsT0FBTyx1QkFBdUI7QUFDOUIsT0FBTywwQkFBMEI7QUFDakMsT0FBTyxzQkFBc0I7QUFFN0IsZUFBZTtBQUVmLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLGFBQWE7QUFBQSxRQUNYO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsZ0NBQ0U7QUFBQSxJQUNKO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0YsZUFBZSxDQUFDLG1CQUFtQixvQkFBb0I7QUFBQSxNQUN2RCxlQUFlLENBQUMsZ0JBQWdCO0FBQUEsSUFDbEMsQ0FBQztBQUFBLElBQ0QsY0FBYztBQUFBLElBQ2QsTUFBTTtBQUFBLE1BQ0osbUJBQW1CLENBQUMsU0FBUyxZQUFZLG9CQUFvQjtBQUFBLE1BQzdELFFBQVE7QUFBQSxRQUNOLHNCQUFzQjtBQUFBLFFBQ3RCLHFCQUFxQjtBQUFBLE1BQ3ZCO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxjQUFjO0FBQUEsRUFDaEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
