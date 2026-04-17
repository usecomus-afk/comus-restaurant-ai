import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Duplex } from "stream";

export const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ event: "connected", data: { ts: Date.now() } }));
  socket.on("error", () => {});
});

export function broadcast(event: string, data: unknown): void {
  const message = JSON.stringify({ event, data, ts: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function handleUpgrade(
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
): void {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
}
