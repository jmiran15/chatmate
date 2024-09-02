import prom from "@isaacs/express-prometheus-middleware";
import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import sourceMapSupport from "source-map-support";

sourceMapSupport.install();
run();

async function run() {
  const viteDevServer =
    process.env.NODE_ENV === "production"
      ? undefined
      : await import("vite").then((vite) =>
          vite.createServer({
            server: { middlewareMode: true },
          }),
        );

  async function getBuild() {
    const build = viteDevServer
      ? await viteDevServer.ssrLoadModule("virtual:remix/server-build")
      : await import("./build/server/index.js");
    return build;
  }

  const remixHandler = createRequestHandler({
    getLoadContext: (_: any, res: any) => ({
      serverBuild: getBuild(),
    }),
    build: getBuild,
    mode: process.env.NODE_ENV,
  });

  const app = express();

  // You need to create the HTTP server from the Express app
  const httpServer = createServer(app);

  // And then attach the socket.io server to the HTTP server
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Be cautious with this in production
      // TODO - change cors origins to local widget and prod widget
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.emit("confirmation", "connected!");

    socket.on("new message", (data) => {
      socket.broadcast.emit("new message", data);
    });

    socket.on("isAgent", (data: { chatId: string; isAgent: boolean }) => {
      socket.broadcast.emit("isAgent", data);
    });

    socket.on("pollingAgent", (data: { chatId: string }) => {
      socket.broadcast.emit("pollingAgent", data);
    });

    socket.on(
      "widgetConnected",
      (data: { sessionId: string; connected: boolean }) => {
        socket.broadcast.emit("widgetConnected", data);
      },
    );

    socket.on("pollingWidgetStatus", (data: { sessionId: string }) => {
      socket.broadcast.emit("pollingWidgetStatus", data);
    });

    socket.on(
      "seenAgentMessage",
      (data: { chatId: string; messageId: string; seenAt: string }) => {
        socket.broadcast.emit("seenAgentMessage", data);
      },
    );
    socket.on(
      "userTyping",
      (data: {
        chatId: string;
        isTyping: boolean;
        typingState?: "typing" | "typed";
        typedContents?: string;
      }) => {
        socket.broadcast.emit("userTyping", data);
      },
    );

    socket.on("agent typing", (data: { chatId: string; isTyping: boolean }) => {
      socket.broadcast.emit("agent typing", data);
    });
  });

  const metricsApp = express();
  app.use(
    prom({
      metricsPath: "/metrics",
      collectDefaultMetrics: true,
      metricsApp,
    }),
  );

  app.use((req, res, next) => {
    // helpful headers:
    res.set("x-fly-region", process.env.FLY_REGION ?? "unknown");
    res.set("Strict-Transport-Security", `max-age=${60 * 60 * 24 * 365 * 100}`);

    // /clean-urls/ -> /clean-urls
    if (req.path.endsWith("/") && req.path.length > 1) {
      const query = req.url.slice(req.path.length);
      const safepath = req.path.slice(0, -1).replace(/\/+/g, "/");
      res.redirect(301, safepath + query);
      return;
    }
    next();
  });

  // if we're not in the primary region, then we need to make sure all
  // non-GET/HEAD/OPTIONS requests hit the primary region rather than read-only
  // Postgres DBs.
  // learn more: https://fly.io/docs/getting-started/multi-region-databases/#replay-the-request
  app.all("*", function getReplayResponse(req, res, next) {
    const { method, path: pathname } = req;
    const { PRIMARY_REGION, FLY_REGION } = process.env;

    const isMethodReplayable = !["GET", "OPTIONS", "HEAD"].includes(method);
    const isReadOnlyRegion =
      FLY_REGION && PRIMARY_REGION && FLY_REGION !== PRIMARY_REGION;

    const shouldReplay = isMethodReplayable && isReadOnlyRegion;

    if (!shouldReplay) return next();

    const logInfo = {
      pathname,
      method,
      PRIMARY_REGION,
      FLY_REGION,
    };
    console.info(`Replaying:`, logInfo);
    res.set("fly-replay", `region=${PRIMARY_REGION}`);
    return res.sendStatus(409);
  });

  app.use(compression());

  // http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
  app.disable("x-powered-by");

  // handle asset requests
  if (viteDevServer) {
    app.use(viteDevServer.middlewares);
  } else {
    app.use(
      "/assets",
      express.static("build/client/assets", {
        immutable: true,
        maxAge: "1y",
      }),
    );
  }

  // Everything else (like favicon.ico) is cached for an hour. You may want to be
  // more aggressive with this caching.
  app.use(express.static("build/client", { maxAge: "1h" }));

  app.use(morgan("tiny"));

  app.all("*", remixHandler);

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`✅ app ready: http://localhost:${port}`);
  });

  const metricsPort = process.env.METRICS_PORT || 3010;

  metricsApp.listen(metricsPort, () => {
    console.log(`✅ metrics ready: http://localhost:${metricsPort}/metrics`);
  });
}
