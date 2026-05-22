import { existsSync } from "node:fs";
import process from "node:process";

interface ResolveShellOptions {
  env?: NodeJS.ProcessEnv;
  pathExists?: (path: string) => boolean;
  platform?: NodeJS.Platform;
}

const unixShellFallbacks = ["/bin/zsh", "/bin/bash", "/bin/sh"];

export const resolveWorkspaceConsoleShell = ({
  env = process.env,
  pathExists = existsSync,
  platform = process.platform,
}: ResolveShellOptions = {}): string => {
  if (platform === "win32") {
    return env.ComSpec || "powershell.exe";
  }

  if (env.SHELL && pathExists(env.SHELL)) return env.SHELL;
  return (
    unixShellFallbacks.find((shell) => pathExists(shell)) ??
    env.SHELL ??
    unixShellFallbacks[0]
  );
};

export const getWorkspaceConsoleShellArgs = (platform = process.platform): string[] =>
  platform === "win32" ? [] : [];
