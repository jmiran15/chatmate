// vite.config.ts
import { vitePlugin as remix } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/@remix-run/dev/dist/index.js";
import { installGlobals } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/@remix-run/node/dist/index.js";
import tsconfigPaths from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { defineConfig } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite/dist/node/index.js";
import { envOnlyMacros } from "file:///Users/jonathanmiranda/Desktop/chatmate/node_modules/vite-env-only/dist/index.js";
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
    envOnlyMacros(),
    remix({
      ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{ts,tsx}"]
      // future: {
      //   v3_fetcherPersist: true,
      //   v3_relativeSplatPath: true,
      //   v3_throwAbortReason: true,
      // },
    }),
    // remix({
    //   serverBuildFile: "remix.js",
    //   buildEnd: async () => {
    //     await esbuild
    //       .build({
    //         alias: { "~": "./app" },
    //         // The final file name
    //         outfile: "build/server/index.js",
    //         // Our server entry point
    //         entryPoints: ["server/index.ts"],
    //         // Dependencies that should not be bundled
    //         // We import the remix build from "../build/server/remix.js", so no need to bundle it again
    //         external: ["./build/server/*"],
    //         platform: "node",
    //         format: "esm",
    //         // Don't include node_modules in the bundle
    //         packages: "external",
    //         bundle: true,
    //         logLevel: "info",
    //       })
    //       .catch((error: unknown) => {
    //         console.error(error);
    //         process.exit(1);
    //       });
    //   },
    // }),
    tsconfigPaths()
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvam9uYXRoYW5taXJhbmRhL0Rlc2t0b3AvY2hhdG1hdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qb25hdGhhbm1pcmFuZGEvRGVza3RvcC9jaGF0bWF0ZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvam9uYXRoYW5taXJhbmRhL0Rlc2t0b3AvY2hhdG1hdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB2aXRlUGx1Z2luIGFzIHJlbWl4IH0gZnJvbSBcIkByZW1peC1ydW4vZGV2XCI7XG5pbXBvcnQgeyBpbnN0YWxsR2xvYmFscyB9IGZyb20gXCJAcmVtaXgtcnVuL25vZGVcIjtcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgZW52T25seU1hY3JvcyB9IGZyb20gXCJ2aXRlLWVudi1vbmx5XCI7XG5cbmluc3RhbGxHbG9iYWxzKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgd2FybXVwOiB7XG4gICAgICBjbGllbnRGaWxlczogW1xuICAgICAgICBcIi4vYXBwL2VudHJ5LmNsaWVudC50c3hcIixcbiAgICAgICAgXCIuL2FwcC9yb290LnRzeFwiLFxuICAgICAgICBcIi4vYXBwL3JvdXRlcy8qKi8qXCIsXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcIi4vYXBwL3JvdXRlcy8qKi8qXCJdLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiLnByaXNtYS9jbGllbnQvaW5kZXgtYnJvd3NlclwiOlxuICAgICAgICBcIi4vbm9kZV9tb2R1bGVzLy5wcmlzbWEvY2xpZW50L2luZGV4LWJyb3dzZXIuanNcIixcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgZW52T25seU1hY3JvcygpLFxuICAgIHJlbWl4KHtcbiAgICAgIGlnbm9yZWRSb3V0ZUZpbGVzOiBbXCIqKi8uKlwiLCBcIioqLyouY3NzXCIsIFwiKiovKi50ZXN0Lnt0cyx0c3h9XCJdLFxuICAgICAgLy8gZnV0dXJlOiB7XG4gICAgICAvLyAgIHYzX2ZldGNoZXJQZXJzaXN0OiB0cnVlLFxuICAgICAgLy8gICB2M19yZWxhdGl2ZVNwbGF0UGF0aDogdHJ1ZSxcbiAgICAgIC8vICAgdjNfdGhyb3dBYm9ydFJlYXNvbjogdHJ1ZSxcbiAgICAgIC8vIH0sXG4gICAgfSksXG4gICAgLy8gcmVtaXgoe1xuICAgIC8vICAgc2VydmVyQnVpbGRGaWxlOiBcInJlbWl4LmpzXCIsXG4gICAgLy8gICBidWlsZEVuZDogYXN5bmMgKCkgPT4ge1xuICAgIC8vICAgICBhd2FpdCBlc2J1aWxkXG4gICAgLy8gICAgICAgLmJ1aWxkKHtcbiAgICAvLyAgICAgICAgIGFsaWFzOiB7IFwiflwiOiBcIi4vYXBwXCIgfSxcbiAgICAvLyAgICAgICAgIC8vIFRoZSBmaW5hbCBmaWxlIG5hbWVcbiAgICAvLyAgICAgICAgIG91dGZpbGU6IFwiYnVpbGQvc2VydmVyL2luZGV4LmpzXCIsXG4gICAgLy8gICAgICAgICAvLyBPdXIgc2VydmVyIGVudHJ5IHBvaW50XG4gICAgLy8gICAgICAgICBlbnRyeVBvaW50czogW1wic2VydmVyL2luZGV4LnRzXCJdLFxuICAgIC8vICAgICAgICAgLy8gRGVwZW5kZW5jaWVzIHRoYXQgc2hvdWxkIG5vdCBiZSBidW5kbGVkXG4gICAgLy8gICAgICAgICAvLyBXZSBpbXBvcnQgdGhlIHJlbWl4IGJ1aWxkIGZyb20gXCIuLi9idWlsZC9zZXJ2ZXIvcmVtaXguanNcIiwgc28gbm8gbmVlZCB0byBidW5kbGUgaXQgYWdhaW5cbiAgICAvLyAgICAgICAgIGV4dGVybmFsOiBbXCIuL2J1aWxkL3NlcnZlci8qXCJdLFxuICAgIC8vICAgICAgICAgcGxhdGZvcm06IFwibm9kZVwiLFxuICAgIC8vICAgICAgICAgZm9ybWF0OiBcImVzbVwiLFxuICAgIC8vICAgICAgICAgLy8gRG9uJ3QgaW5jbHVkZSBub2RlX21vZHVsZXMgaW4gdGhlIGJ1bmRsZVxuICAgIC8vICAgICAgICAgcGFja2FnZXM6IFwiZXh0ZXJuYWxcIixcbiAgICAvLyAgICAgICAgIGJ1bmRsZTogdHJ1ZSxcbiAgICAvLyAgICAgICAgIGxvZ0xldmVsOiBcImluZm9cIixcbiAgICAvLyAgICAgICB9KVxuICAgIC8vICAgICAgIC5jYXRjaCgoZXJyb3I6IHVua25vd24pID0+IHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIC8vICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIC8vICAgICAgIH0pO1xuICAgIC8vICAgfSxcbiAgICAvLyB9KSxcbiAgICB0c2NvbmZpZ1BhdGhzKCksXG4gIF0sXG59KTtcblxuLy8gaW1wb3J0IHsgdml0ZVBsdWdpbiBhcyByZW1peCB9IGZyb20gXCJAcmVtaXgtcnVuL2RldlwiO1xuLy8gaW1wb3J0IHsgaW5zdGFsbEdsb2JhbHMgfSBmcm9tIFwiQHJlbWl4LXJ1bi9ub2RlXCI7XG4vLyBpbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xuLy8gaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcblxuLy8gaW5zdGFsbEdsb2JhbHMoKTtcblxuLy8gZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbi8vICAgc2VydmVyOiB7XG4vLyAgICAgcG9ydDogMzAwMCxcbi8vICAgfSxcbi8vICAgcGx1Z2luczogW1xuLy8gICAgIHJlbWl4KHtcbi8vICAgICAgIGlnbm9yZWRSb3V0ZUZpbGVzOiBbXCIqKi8uKlwiLCBcIioqLyouY3NzXCIsIFwiKiovKi50ZXN0Lnt0cyx0c3h9XCJdLFxuLy8gICAgICAgZnV0dXJlOiB7XG4vLyAgICAgICAgIHYzX2ZldGNoZXJQZXJzaXN0OiB0cnVlLFxuLy8gICAgICAgICB2M19yZWxhdGl2ZVNwbGF0UGF0aDogdHJ1ZSxcbi8vICAgICAgICAgdjNfdGhyb3dBYm9ydFJlYXNvbjogdHJ1ZSxcbi8vICAgICAgIH0sXG4vLyAgICAgfSksXG4vLyAgICAgdHNjb25maWdQYXRocygpLFxuLy8gICAgIGVudk9ubHlNYWNyb3MoKSxcbi8vICAgXSxcbi8vIH0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1UyxTQUFTLGNBQWMsYUFBYTtBQUMzVSxTQUFTLHNCQUFzQjtBQUMvQixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHFCQUFxQjtBQUU5QixlQUFlO0FBRWYsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sYUFBYTtBQUFBLFFBQ1g7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLG1CQUFtQjtBQUFBLEVBQy9CO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxnQ0FDRTtBQUFBLElBQ0o7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxjQUFjO0FBQUEsSUFDZCxNQUFNO0FBQUEsTUFDSixtQkFBbUIsQ0FBQyxTQUFTLFlBQVksb0JBQW9CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBTS9ELENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUEyQkQsY0FBYztBQUFBLEVBQ2hCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
