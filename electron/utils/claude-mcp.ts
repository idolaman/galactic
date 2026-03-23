import { execFile } from "node:child_process";
import type { ExecFileException } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const CLAUDE_MCP_ADD_ARGS = [
  "mcp",
  "add",
  "--transport",
  "http",
  "--scope",
  "user",
  "galactic",
  "http://localhost:17890",
] as const;

export const CLAUDE_MCP_GET_ARGS = ["mcp", "get", "galactic"] as const;

export interface ClaudeMcpInstallResult {
  success: boolean;
  error?: string;
}

export type ClaudeCommandRunner = (args: string[]) => Promise<unknown>;

type ClaudeCommandError = ExecFileException & {
  code?: number | string;
  stderr?: string;
  stdout?: string;
};

const defaultRunClaudeCommand: ClaudeCommandRunner = async (args) => {
  await execFileAsync("claude", args);
};

const getClaudeCommandOutput = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "";
  }

  const commandError = error as ClaudeCommandError;
  return [commandError.stdout, commandError.stderr, commandError.message]
    .filter(Boolean)
    .join("\n");
};

const isMissingServerError = (error: unknown): boolean => {
  const commandError = error as ClaudeCommandError;
  return commandError.code === 1 && getClaudeCommandOutput(error).includes("No MCP server found with name");
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const checkClaudeMcpInstalled = async (
  runClaudeCommand: ClaudeCommandRunner = defaultRunClaudeCommand,
): Promise<boolean> => {
  try {
    await runClaudeCommand([...CLAUDE_MCP_GET_ARGS]);
    return true;
  } catch (error) {
    if (isMissingServerError(error)) {
      return false;
    }

    console.warn("Failed to check Claude Code MCP installation:", getErrorMessage(error, "Unknown error"));
    return false;
  }
};

export const installClaudeMcp = async (
  runClaudeCommand: ClaudeCommandRunner = defaultRunClaudeCommand,
): Promise<ClaudeMcpInstallResult> => {
  if (await checkClaudeMcpInstalled(runClaudeCommand)) {
    return { success: true };
  }

  try {
    await runClaudeCommand([...CLAUDE_MCP_ADD_ARGS]);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to install Claude Code MCP.");
    console.error("Failed to install Claude Code MCP:", message);
    return { success: false, error: message };
  }
};
