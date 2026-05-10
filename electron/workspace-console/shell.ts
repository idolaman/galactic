import process from "node:process";

interface ResolveShellOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

const unixShellFallbacks = ["/bin/zsh", "/bin/bash", "/bin/sh"];

export const resolveWorkspaceConsoleShell = ({
  env = process.env,
  platform = process.platform,
}: ResolveShellOptions = {}): string => {
  if (platform === "win32") {
    return env.ComSpec || "powershell.exe";
  }

  return env.SHELL || unixShellFallbacks[0];
};

export const getWorkspaceConsoleShellArgs = (platform = process.platform): string[] =>
  platform === "win32" ? [] : [];
