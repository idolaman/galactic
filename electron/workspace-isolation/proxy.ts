import * as http from "node:http";
import * as net from "node:net";
import type { WorkspaceIsolationRoute } from "./types.js";

const HEALTH_HEADER = "X-Galactic-Proxy";
const HOPS_HEADER = "x-galactic-hops";
const MAX_PROXY_HOPS = 5;

export const getWorkspaceIsolationRequestHost = (req: http.IncomingMessage): string => {
  const authority = req.headers[":authority"];
  if (typeof authority === "string" && authority) {
    return authority;
  }
  return req.headers.host ?? "";
};

const buildPage = (status: number, title: string, description: string): string => `<!doctype html>
<html><head><meta charset="utf-8" /><title>${status} ${title}</title></head>
<body style="font-family: ui-monospace, monospace; background:#050510; color:#f8fafc; padding:32px;">
<h1 style="margin:0 0 12px;">${status} ${title}</h1><p style="margin:0; color:#94a3b8;">${description}</p>
</body></html>`;

export const buildWorkspaceIsolationForwardedHeaders = (req: http.IncomingMessage): Record<string, string> => {
  const host = getWorkspaceIsolationRequestHost(req);
  const remoteAddress = req.socket.remoteAddress || "127.0.0.1";
  return {
    "x-forwarded-for": req.headers["x-forwarded-for"] ? `${req.headers["x-forwarded-for"]}, ${remoteAddress}` : remoteAddress,
    "x-forwarded-host": (req.headers["x-forwarded-host"] as string) || host,
    "x-forwarded-port": (req.headers["x-forwarded-port"] as string) || host.split(":")[1] || "1355",
    "x-forwarded-proto": (req.headers["x-forwarded-proto"] as string) || "http",
  };
};

export const findWorkspaceIsolationRoute = (routes: WorkspaceIsolationRoute[], host: string): WorkspaceIsolationRoute | undefined =>
  routes.find((route) => route.hostname === host);

interface WorkspaceIsolationProxyDependencies {
  request: typeof http.request;
}

const defaultDependencies: WorkspaceIsolationProxyDependencies = {
  request: http.request,
};

export const createWorkspaceIsolationProxyHandlers = (
  getRoutes: () => WorkspaceIsolationRoute[],
  onError: (message: string) => void,
  dependencies: WorkspaceIsolationProxyDependencies = defaultDependencies,
) => {
  const requestImpl = dependencies.request;

  const handleRequest = (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.setHeader(HEALTH_HEADER, "1");
    const host = getWorkspaceIsolationRequestHost(req).split(":")[0];
    if (!host) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing Host header");
      return;
    }
    const hops = Number.parseInt((req.headers[HOPS_HEADER] as string) || "0", 10) || 0;
    if (hops >= MAX_PROXY_HOPS) {
      res.writeHead(508, { "Content-Type": "text/html" });
      res.end(buildPage(508, "Loop Detected", "A dev server is proxying back through Galactic without rewriting Host."));
      return;
    }
    const route = findWorkspaceIsolationRoute(getRoutes(), host);
    if (!route) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end(buildPage(404, "Route Not Found", `No routed service is registered for ${host}.`));
      return;
    }
    const headers: http.OutgoingHttpHeaders = { ...req.headers, ...buildWorkspaceIsolationForwardedHeaders(req), [HOPS_HEADER]: String(hops + 1) };
    Object.keys(headers).forEach((key) => {
      if (key.startsWith(":")) {
        delete headers[key];
      }
    });
    const proxyReq = requestImpl({ hostname: "127.0.0.1", port: route.port, path: req.url, method: req.method, headers }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, { ...proxyRes.headers, [HEALTH_HEADER]: "1" });
      proxyRes.on("error", () => res.destroy());
      proxyRes.pipe(res);
    });
    proxyReq.on("error", (error) => {
      onError(`Workspace Isolation proxy error for ${host}: ${error.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/html" });
      }
      res.end(buildPage(502, "Backend Unreachable", "The target localhost service is not responding."));
    });
    res.on("close", () => {
      if (!proxyReq.destroyed) {
        proxyReq.destroy();
      }
    });
    req.pipe(proxyReq);
  };

  const handleUpgrade = (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    socket.on("error", () => socket.destroy());
    const host = getWorkspaceIsolationRequestHost(req).split(":")[0];
    const hops = Number.parseInt((req.headers[HOPS_HEADER] as string) || "0", 10) || 0;
    const route = findWorkspaceIsolationRoute(getRoutes(), host);
    if (!route || hops >= MAX_PROXY_HOPS) {
      socket.destroy();
      return;
    }
    const headers: http.OutgoingHttpHeaders = { ...req.headers, ...buildWorkspaceIsolationForwardedHeaders(req), [HOPS_HEADER]: String(hops + 1) };
    const proxyReq = requestImpl({ hostname: "127.0.0.1", port: route.port, path: req.url, method: req.method, headers });
    proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
      let response = "HTTP/1.1 101 Switching Protocols\r\n";
      for (let index = 0; index < proxyRes.rawHeaders.length; index += 2) {
        response += `${proxyRes.rawHeaders[index]}: ${proxyRes.rawHeaders[index + 1]}\r\n`;
      }
      response += `${HEALTH_HEADER}: 1\r\n\r\n`;
      socket.write(response);
      if (proxyHead.length > 0) {
        socket.write(proxyHead);
      }
      if (head.length > 0) {
        proxySocket.write(head);
      }
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });
    proxyReq.on("error", (error) => {
      onError(`Workspace Isolation websocket proxy error for ${host}: ${error.message}`);
      socket.destroy();
    });
    proxyReq.end();
  };

  return { handleRequest, handleUpgrade };
};

export const createWorkspaceIsolationProxy = (
  getRoutes: () => WorkspaceIsolationRoute[],
  onError: (message: string) => void,
): http.Server => {
  const { handleRequest, handleUpgrade } = createWorkspaceIsolationProxyHandlers(getRoutes, onError);
  const server = http.createServer(handleRequest);
  server.on("upgrade", handleUpgrade);

  return server;
};
