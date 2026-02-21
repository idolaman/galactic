import assert from "node:assert/strict";
import test from "node:test";
import { loadProjectBranchesCore, type ToastOptions } from "../../src/lib/load-project-branches.js";

const defaultToast: ToastOptions = {
  title: "Fetch failed",
  description: "Unable to fetch branches.",
  variant: "destructive",
};

test("clears branches and skips loading when project is not a git repo", async () => {
  const branches: string[][] = [];
  const loading: boolean[] = [];
  let fetchCalls = 0;
  let listCalls = 0;

  await loadProjectBranchesCore(
    { path: "/repo", isGitRepo: false },
    {
      fetchBranches: async () => {
        fetchCalls += 1;
        return { success: true };
      },
      listBranches: async () => {
        listCalls += 1;
        return ["main"];
      },
      getFetchBranchesToast: () => null,
    },
    {
      setIsLoadingBranches: (isLoading) => loading.push(isLoading),
      setProjectBranches: (next) => branches.push(next),
      toast: () => undefined,
    },
  );

  assert.deepEqual(branches, [[]]);
  assert.deepEqual(loading, []);
  assert.equal(fetchCalls, 0);
  assert.equal(listCalls, 0);
});

test("fetches and lists branches for a valid git project", async () => {
  const branches: string[][] = [];
  const loading: boolean[] = [];
  const toastCalls: ToastOptions[] = [];
  let fetchCalls = 0;
  let listCalls = 0;

  await loadProjectBranchesCore(
    { path: "/repo", isGitRepo: true },
    {
      fetchBranches: async () => {
        fetchCalls += 1;
        return { success: true };
      },
      listBranches: async () => {
        listCalls += 1;
        return ["main", "feature"];
      },
      getFetchBranchesToast: () => null,
    },
    {
      setIsLoadingBranches: (isLoading) => loading.push(isLoading),
      setProjectBranches: (next) => branches.push(next),
      toast: (next) => toastCalls.push(next),
    },
  );

  assert.equal(fetchCalls, 1);
  assert.equal(listCalls, 1);
  assert.deepEqual(loading, [true, false]);
  assert.deepEqual(branches, [["main", "feature"]]);
  assert.deepEqual(toastCalls, []);
});

test("lists branches and shows toast when fetch fails", async () => {
  const branches: string[][] = [];
  const loading: boolean[] = [];
  const toastCalls: ToastOptions[] = [];
  let listCalls = 0;

  await loadProjectBranchesCore(
    { path: "/repo", isGitRepo: true },
    {
      fetchBranches: async () => ({ success: false, reason: "network", error: "offline" }),
      listBranches: async () => {
        listCalls += 1;
        return ["main"];
      },
      getFetchBranchesToast: () => defaultToast,
    },
    {
      setIsLoadingBranches: (isLoading) => loading.push(isLoading),
      setProjectBranches: (next) => branches.push(next),
      toast: (next) => toastCalls.push(next),
    },
  );

  assert.equal(listCalls, 1);
  assert.deepEqual(loading, [true, false]);
  assert.deepEqual(branches, [["main"]]);
  assert.deepEqual(toastCalls, [defaultToast]);
});
