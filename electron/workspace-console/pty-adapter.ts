import { chmodSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import * as pty from "node-pty";

interface Disposable {
  dispose: () => void;
}

export interface WorkspaceConsolePty {
  kill: () => void;
  onData: (listener: (data: string) => void) => Disposable;
  onError?: (listener: (error: Error) => void) => Disposable;
  onExit: (listener: (event: { exitCode: number; signal?: number }) => void) => Disposable;
  resize: (cols: number, rows: number) => void;
  write: (data: string) => void;
}

export interface WorkspaceConsolePtySpawnOptions {
  cols: number;
  cwd: string;
  env: NodeJS.ProcessEnv;
  rows: number;
  shell: string;
  shellArgs: string[];
}

export interface WorkspaceConsolePtyAdapter {
  spawn: (options: WorkspaceConsolePtySpawnOptions) => WorkspaceConsolePty;
}

interface NodePtyNativeModule {
  dir: string;
}

interface NodePtyUtils {
  loadNativeModule: (moduleName: string) => NodePtyNativeModule;
}

const require = createRequire(import.meta.url);

const getPtySpawnErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown PTY spawn error.";

export const resolveNodePtySpawnHelperPath = (): string | null => {
  if (process.platform !== "darwin") return null;

  try {
    const { loadNativeModule } = require("node-pty/lib/utils") as NodePtyUtils;
    const native = loadNativeModule("pty");
    const unixTerminalPath = require.resolve("node-pty/lib/unixTerminal");

    return path
      .resolve(path.dirname(unixTerminalPath), native.dir, "spawn-helper")
      .replace("app.asar", "app.asar.unpacked")
      .replace("node_modules.asar", "node_modules.asar.unpacked");
  } catch {
    return null;
  }
};

export const ensureNodePtySpawnHelperExecutable = (
  helperPath = resolveNodePtySpawnHelperPath(),
): void => {
  if (!helperPath) return;

  const mode = statSync(helperPath).mode;
  if ((mode & 0o111) !== 0) return;
  chmodSync(helperPath, (mode & 0o777) | 0o755);
};

export const nodePtyWorkspaceConsoleAdapter: WorkspaceConsolePtyAdapter = {
  spawn: ({ cols, cwd, env, rows, shell, shellArgs }) => {
    try {
      ensureNodePtySpawnHelperExecutable();
      return pty.spawn(shell, shellArgs, {
        cols,
        cwd,
        env: { ...process.env, ...env, TERM: "xterm-256color" },
        name: "xterm-256color",
        rows,
      });
    } catch (error) {
      throw new Error(
        `Failed to start workspace terminal shell "${shell}": ${getPtySpawnErrorMessage(error)}`,
      );
    }
  },
};
