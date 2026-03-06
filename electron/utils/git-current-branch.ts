import { execFile, type ExecFileException } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitCurrentBranchResult {
  success: boolean;
  branch?: string;
  error?: string;
}

type RunGit = (args: string[], cwd: string) => Promise<{ stdout: string }>;

const runGitCommand: RunGit = async (args, cwd) => {
  return await execFileAsync("git", args, { cwd });
};

export const getGitCurrentBranch = async (
  projectPath: string,
  runGit: RunGit = runGitCommand,
): Promise<GitCurrentBranchResult> => {
  if (!projectPath) {
    return { success: false, error: "Project path is required." };
  }

  try {
    const { stdout } = await runGit(["branch", "--show-current"], projectPath);
    const branch = stdout.trim();
    if (!branch) {
      return { success: false, error: "No current branch found in project root." };
    }
    return { success: true, branch };
  } catch (error) {
    const execError = error as ExecFileException & { stderr?: string };
    const errorMessage = execError?.stderr || execError?.message || "Unknown error reading current branch.";
    return { success: false, error: errorMessage };
  }
};
