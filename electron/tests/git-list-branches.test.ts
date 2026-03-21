import assert from "node:assert/strict";
import test from "node:test";
import { listGitBranches } from "../utils/git-list-branches.js";

test("listGitBranches returns sorted local branches for local scope", async () => {
  const calls: string[][] = [];
  const branches = await listGitBranches(
    "/repo",
    { scope: "local" },
    async (args) => {
      calls.push(args);
      return { stdout: "feature/zeta\nmain\n" };
    },
  );

  assert.deepEqual(calls, [
    ["for-each-ref", "--format=%(refname:short)", "refs/heads/"],
  ]);
  assert.deepEqual(branches, ["feature/zeta", "main"]);
});

test("listGitBranches merges local and remote branches for all scope", async () => {
  const calls: string[][] = [];
  const branches = await listGitBranches(
    "/repo",
    {},
    async (args) => {
      calls.push(args);
      if (args[2] === "refs/heads/") {
        return { stdout: "main\nrelease/1.0\n" };
      }

      return {
        stdout: "origin/feature/api\norigin/main\norigin/HEAD\n",
      };
    },
  );

  assert.deepEqual(calls, [
    ["for-each-ref", "--format=%(refname:short)", "refs/heads/"],
    ["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin/"],
  ]);
  assert.deepEqual(branches, ["feature/api", "main", "release/1.0"]);
});
