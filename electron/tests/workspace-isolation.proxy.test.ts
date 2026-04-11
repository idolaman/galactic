import assert from "node:assert/strict";
import * as http from "node:http";
import { PassThrough } from "node:stream";
import test from "node:test";
import { createWorkspaceIsolationProxyHandlers } from "../workspace-isolation/proxy.js";

const createRequest = (host: string, headers: Record<string, string> = {}) => {
  const request = new PassThrough() as PassThrough & http.IncomingMessage;
  request.headers = { host, ...headers };
  request.method = "GET";
  request.url = "/";
  request.socket = { remoteAddress: "127.0.0.1" } as http.IncomingMessage["socket"];
  return request;
};

const createResponse = () => {
  const response = new PassThrough() as any;
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body = "";
  response.headersSent = false;
  response.setHeader = (name: string, value: string) => {
    headers[name.toLowerCase()] = value;
    return response;
  };
  response.writeHead = (
    status: number,
    statusMessageOrHeaders?: string | http.OutgoingHttpHeaders,
    maybeHeaders?: http.OutgoingHttpHeaders,
  ) => {
    statusCode = status;
    response.headersSent = true;
    const nextHeaders = typeof statusMessageOrHeaders === "string"
      ? maybeHeaders
      : statusMessageOrHeaders;
    Object.entries(nextHeaders ?? {}).forEach(([key, value]) => {
      headers[key.toLowerCase()] = String(value);
    });
    return response;
  };
  response.on("data", (chunk: Buffer | string) => {
    body += chunk.toString();
  });
  return {
    response,
    read: async () => {
      if (!response.readableEnded) {
        await new Promise<void>((resolve) => response.on("end", () => resolve()));
      }
      return { statusCode, headers, body };
    },
  };
};

const createProxyRequest = (callback?: (res: http.IncomingMessage) => void) => {
  const request = new PassThrough() as any;
  if (callback) {
    const proxyResponse = new PassThrough() as any;
    proxyResponse.headers = { "content-type": "text/plain" };
    proxyResponse.statusCode = 200;
    process.nextTick(() => {
      callback(proxyResponse);
      proxyResponse.end("hello");
    });
  }
  return request;
};

test("workspace isolation proxy request handler routes, errors, and detects loops", async () => {
  const { handleRequest } = createWorkspaceIsolationProxyHandlers(
    () => [{ hostname: "api.root.demo.localhost", port: 4310 }],
    () => undefined,
    {
      request: ((...args: unknown[]) =>
        createProxyRequest(args[1] as ((res: http.IncomingMessage) => void) | undefined)) as typeof http.request,
    },
  );

  const okRequest = createRequest("api.root.demo.localhost");
  const okResponse = createResponse();
  handleRequest(okRequest, okResponse.response);
  okRequest.end();
  const okResult = await okResponse.read();
  assert.equal(okResult.statusCode, 200);
  assert.equal(okResult.body, "hello");
  assert.equal(okResult.headers["x-galactic-proxy"], "1");

  const missingRequest = createRequest("missing.root.demo.localhost");
  const missingResponse = createResponse();
  handleRequest(missingRequest, missingResponse.response);
  missingRequest.end();
  const missingResult = await missingResponse.read();
  assert.equal(missingResult.statusCode, 404);
  assert.match(missingResult.body, /Route Not Found/);

  const loopRequest = createRequest("api.root.demo.localhost", { "x-galactic-hops": "5" });
  const loopResponse = createResponse();
  handleRequest(loopRequest, loopResponse.response);
  loopRequest.end();
  const loopResult = await loopResponse.read();
  assert.equal(loopResult.statusCode, 508);
  assert.match(loopResult.body, /Loop Detected/);
});

test("workspace isolation proxy request handler returns 502 when backend fails", async () => {
  const { handleRequest } = createWorkspaceIsolationProxyHandlers(
    () => [{ hostname: "api.root.demo.localhost", port: 4310 }],
    () => undefined,
    {
      request: ((..._args: unknown[]) => {
        const request = createProxyRequest();
        process.nextTick(() => request.emit("error", new Error("ECONNREFUSED")));
        return request as ReturnType<typeof http.request>;
      }) as typeof http.request,
    },
  );

  const req = createRequest("api.root.demo.localhost");
  const res = createResponse();
  handleRequest(req, res.response);
  req.end();
  const result = await res.read();
  assert.equal(result.statusCode, 502);
  assert.match(result.body, /Backend Unreachable/);
});

test("workspace isolation proxy upgrade handler forwards websocket responses", async () => {
  const { handleUpgrade } = createWorkspaceIsolationProxyHandlers(
    () => [{ hostname: "api.root.demo.localhost", port: 4310 }],
    () => undefined,
    {
      request: ((..._args: unknown[]) => {
        const request = createProxyRequest();
        const proxySocket = new PassThrough();
        process.nextTick(() => {
          request.emit("upgrade", {
            rawHeaders: ["Connection", "Upgrade", "Upgrade", "websocket", "Sec-WebSocket-Accept", "test"],
          }, proxySocket, Buffer.from("backend-ready"));
        });
        return request as ReturnType<typeof http.request>;
      }) as typeof http.request,
    },
  );

  const request = createRequest("api.root.demo.localhost");
  const socket = new PassThrough();
  let output = "";
  socket.on("data", (chunk) => {
    output += chunk.toString();
  });
  handleUpgrade(request, socket as never, Buffer.alloc(0));
  await new Promise((resolve) => process.nextTick(resolve));
  assert.match(output, /101 Switching Protocols/);
  assert.match(output, /backend-ready/);
});
