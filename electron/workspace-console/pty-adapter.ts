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

const getPtySpawnErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown PTY spawn error.";

export const nodePtyWorkspaceConsoleAdapter: WorkspaceConsolePtyAdapter = {
  spawn: ({ cols, cwd, env, rows, shell, shellArgs }) => {
    try {
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
