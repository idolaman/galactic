#!/usr/bin/env node
import { spawn } from "node:child_process";

import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const host = process.env.VITE_HOST || "127.0.0.1";
const port = process.env.VITE_PORT || "8080";
const waitHost = host === "::" ? "127.0.0.1" : host;
const startUrl = process.env.ELECTRON_START_URL || `http://${waitHost}:${port}`;

const run = (command, args, env = process.env) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? 1}`));
    });
  });

try {
  await run("wait-on", [startUrl]);
  await run("electron", ["."], {
    ...process.env,
    ELECTRON_START_URL: startUrl,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to start Electron.");
  process.exit(1);
}
