import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess: ChildProcess | null = null;

const DEFAULT_PORT = 17890;

interface McpServerOptions {
  port?: number;
  tokenless?: boolean;
}

/** Get the path to the bundled MCP server */
function getServerPath(): string {
  if (app.isPackaged) {
    // Production: inside app bundle Resources
    return path.join(process.resourcesPath, "mcp-server", "server.cjs");
  }
  // Development: relative to project root
  return path.join(__dirname, "../resources/mcp-server/server.cjs");
}

/** Start the MCP server */
export function startMcpServer(options?: McpServerOptions): void {
  if (serverProcess) {
    console.log("[MCP Server] Already running");
    return;
  }

  const serverPath = getServerPath();
  const port = options?.port ?? DEFAULT_PORT;

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    THINKING_LOGGER_HTTP_PORT: String(port),
    THINKING_LOGGER_LOG_LEVEL: "info",
  };

  if (options?.tokenless) {
    env.THINKING_LOGGER_NO_TOKEN = "1";
  }

  // Use Electron as Node.js by setting ELECTRON_RUN_AS_NODE
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...env,
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (data: Buffer) => {
    console.log(`[MCP Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on("data", (data: Buffer) => {
    console.error(`[MCP Server Error] ${data.toString().trim()}`);
  });

  serverProcess.on("exit", (code) => {
    console.log(`[MCP Server] Exited with code ${code}`);
    serverProcess = null;
  });

  serverProcess.on("error", (err) => {
    console.error("[MCP Server] Failed to start:", err);
    serverProcess = null;
  });

  console.log(`[MCP Server] Starting on port ${port}...`);
}

/** Stop the MCP server */
export function stopMcpServer(): void {
  if (!serverProcess) return;

  serverProcess.kill("SIGTERM");
  serverProcess = null;
  console.log("[MCP Server] Stopped");
}

/** Check if the server is running */
export function isMcpServerRunning(): boolean {
  return serverProcess !== null && !serverProcess.killed;
}

/** Get the server URL */
export function getMcpServerUrl(port = DEFAULT_PORT): string {
  return `http://localhost:${port}`;
}

/** Restart the MCP server */
export function restartMcpServer(options?: McpServerOptions): void {
  stopMcpServer();
  startMcpServer(options);
}

