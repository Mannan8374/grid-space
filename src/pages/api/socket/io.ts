import { NextApiResponseServerIo } from "@/lib/types";
import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { NextApiRequest } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;

    const io = new ServerIO(httpServer, {
      path,
      addTrailingSlash: false,
    });

    io.on("connection", (s) => {
      // ✅ editor collaboration
      s.on("create-room", (fileId) => {
        s.join(fileId);
      });

      s.on("send-changes", (deltas, fileId) => {
        s.to(fileId).emit("receive-changes", deltas, fileId);
      });

      s.on("send-cursor-move", (range, fileId, cursorId, user) => {
        s.to(fileId).emit("receive-cursor-move", range, fileId, cursorId, user);
      });

      // ✅ NEW: broadcast workspace logo updates
      s.on("workspace-logo-updated", (workspaceId, logoUrl) => {
        console.log("Logo updated:", workspaceId, logoUrl);
        s.broadcast.emit("workspace-logo-updated", { workspaceId, logoUrl });
      });
    });

    res.socket.server.io = io;
    console.log("✅ Socket.IO initialized");
  }

  res.end();
};

export default ioHandler;
