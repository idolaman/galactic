import { promises as fs } from "node:fs";
import path from "node:path";
import { getHookCommandPath, getHookRunnerPath } from "./paths.js";
import { getHookRunnerSource } from "./runner-template.js";

const unixWrapperSource = "#!/usr/bin/env sh\nnode \"$(dirname \"$0\")/galactic-hook.mjs\" \"$@\"\n";
const windowsWrapperSource = "@echo off\r\nnode \"%~dp0galactic-hook.mjs\" %*\r\n";

export const ensureHookRunnerInstalled = async (homeDirectory?: string): Promise<string> => {
  const runnerPath = getHookRunnerPath(homeDirectory);
  const commandPath = getHookCommandPath(homeDirectory);
  await fs.mkdir(path.dirname(runnerPath), { recursive: true });
  await fs.writeFile(runnerPath, getHookRunnerSource(), "utf8");
  await fs.chmod(runnerPath, 0o755);

  const wrapperSource = process.platform === "win32" ? windowsWrapperSource : unixWrapperSource;
  await fs.writeFile(commandPath, wrapperSource, "utf8");
  await fs.chmod(commandPath, 0o755);
  return commandPath;
};
