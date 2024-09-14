import type { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server | undefined;

declare global {
  // eslint-disable-next-line no-var
  var __io: Server | undefined;
}

export function initializeSocket(httpServer: HttpServer) {
  // if (process.env.NODE_ENV === "production") {
  // io = new Server(httpServer, {
  //   cors: {
  //     origin: "*", // Be cautious with this in production
  //     // TODO - change cors origins to local widget and prod widget
  //     methods: ["GET", "POST"],
  //   },
  // });
  // } else {
  if (!global.__io) {
    global.__io = new Server(httpServer, {
      cors: {
        origin: "*", // Be cautious with this in production
        // TODO - change cors origins to local widget and prod widget
        methods: ["GET", "POST"],
      },
    });
  }
  io = global.__io;
  console.log("Socket.IO initialized: ", io);

  // }

  io.on("connection", (socket) => {
    socket.emit("confirmation", "connected!");

    socket.on("new message", (data) => {
      console.log("new message", data);
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

  // Add this new event listener for the global io instance
  io.on("new message", (data) => {
    console.log("Broadcasting new message", data);
    if (io) {
      io.emit("new message", data);
    } else {
      console.warn("Socket.IO instance not initialized");
    }
  });

  //   io.on("new message", (data) => {
  //     console.log("new message", data);
  //     // broadcast to all clients except the sender
  //     io
  //   });
}

export function getIO(): Server | undefined {
  return global.__io;
  // return io;
}
