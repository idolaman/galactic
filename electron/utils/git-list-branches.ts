import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitBranchListOptions {
  scope?: "all" | "local";
}

type GitCommandRunner = (
  args: string[],
  projectPath: string,
) => Promise<{ stdout: string }>;

const listRefs = async (
  projectPath: string,
  refPath: string,
  runGit: GitCommandRunner,
): Promise<string[]> => {
  const { stdout } = await runGit(
    ["for-each-ref", "--format=%(refname:short)", refPath],
    projectPath,
  );

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

export const listGitBranches = async (
  projectPath: string,
  options: GitBranchListOptions = {},
  runGit: GitCommandRunner = async (args, cwd) => {
    return execFileAsync("git", args, { cwd });
  },
): Promise<string[]> => {
  const localBranches = await listRefs(projectPath, "refs/heads/", runGit);
  if (options.scope === "local") {
    return localBranches.sort();
  }

  const remoteBranches = await listRefs(
    projectPath,
    "refs/remotes/origin/",
    runGit,
  );
  const normalizedRemoteBranches = remoteBranches
    .map((branch) => branch.replace(/^origin\//, ""))
    .filter((branch) => branch !== "HEAD" && branch !== "origin" && branch !== "");

  return [...new Set([...localBranches, ...normalizedRemoteBranches])].sort();
};
