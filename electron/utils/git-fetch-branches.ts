import { execFile } from "node:child_process";
import type { ExecFileException } from "node:child_process";
import { promisify } from "node:util";

export type GitFetchFailureReason =
  | "auth-cancelled"
  | "auth-required"
  | "network"
  | "unknown";

export interface GitFetchBranchesResult {
  success: boolean;
  error?: string;
  reason?: GitFetchFailureReason;
}

export interface GitCommandRunnerOptions {
  cwd: string;
}

export type GitCommandRunner = (
  args: string[],
  options: GitCommandRunnerOptions,
) => Promise<void>;

const execFileAsync = promisify(execFile);

const authCancelledPatterns = [
  /device not configured/i,
  /user cancelled/i,
  /user canceled/i,
  /user denied/i,
];

const authRequiredPatterns = [
  /could not read username/i,
  /authentication failed/i,
  /repository not found/i,
  /support for password authentication was removed/i,
];

const networkPatterns = [
  /could not resolve host/i,
  /failed to connect/i,
  /connection timed out/i,
  /network is unreachable/i,
  /connection reset/i,
];

const runGitCommand: GitCommandRunner = async (args, options) => {
  await execFileAsync("git", args, options);
};

const getErrorMessage = (error: unknown): string => {
  const execError = error as ExecFileException & { stderr?: string };
  return execError?.stderr || execError?.message || "Unknown error fetching branches.";
};

const matchesAnyPattern = (value: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(value));

export const classifyFetchError = (message: string): GitFetchFailureReason => {
  if (!message.trim()) {
    return "unknown";
  }

  if (matchesAnyPattern(message, authCancelledPatterns)) {
    return "auth-cancelled";
  }
  if (matchesAnyPattern(message, authRequiredPatterns)) {
    return "auth-required";
  }
  if (matchesAnyPattern(message, networkPatterns)) {
    return "network";
  }
  return "unknown";
};

export const fetchGitBranchesWithReason = async (
  projectPath: string,
  commandRunner: GitCommandRunner = runGitCommand,
): Promise<GitFetchBranchesResult> => {
  try {
    await commandRunner(["fetch", "--all", "--prune"], { cwd: projectPath });
    return { success: true };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    return {
      success: false,
      error: errorMessage,
      reason: classifyFetchError(errorMessage),
    };
  }
};
