import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer } from "ws";
import { bridgeTerminalWebSocket } from "./src/lib/vmsan-manager/terminal-bridge";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || "", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling request:", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upgradeHandler = typeof (app as any).getUpgradeHandler === "function"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (app as any).getUpgradeHandler()
    : null;

  server.on("upgrade", (req, socket, head) => {
    try {
      const parsedUrl = parse(req.url || "", true);
      const pathname = parsedUrl.pathname || "";
      const match = pathname.match(/^\/api\/vms\/([^/]+)\/terminal\/ws$/);

      if (match) {
        const vmId = decodeURIComponent(match[1]);
        const sudo = parsedUrl.query.sudo === "true";

        wss.handleUpgrade(req, socket, head, (ws) => {
          bridgeTerminalWebSocket(ws, {
            vmId,
            sudo,
          });
        });
      } else if (upgradeHandler) {
        upgradeHandler(req, socket, head);
      } else {
        socket.destroy();
      }
    } catch {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(
      `> Ready on http://${hostname}:${port} as ${
        dev ? "development" : (process.env.NODE_ENV ?? "production")
      }`
    );
  });
});
