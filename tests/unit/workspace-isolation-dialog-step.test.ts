import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceIsolationDialogOpeningState,
  getWorkspaceIsolationDialogInitialStep,
  getWorkspaceIsolationIntroAction,
  requiresWorkspaceIsolationShellHooks,
} from "../../src/lib/workspace-isolation-dialog-step.js";

test("requiresWorkspaceIsolationShellHooks only blocks when hooks are supported and disabled", () => {
  assert.equal(requiresWorkspaceIsolationShellHooks(null), false);
  assert.equal(
    requiresWorkspaceIsolationShellHooks({ enabled: false, supported: false, installed: false, hookPath: null, zshrcPath: null }),
    false,
  );
  assert.equal(
    requiresWorkspaceIsolationShellHooks({ enabled: true, supported: true, installed: true, hookPath: "/hook.zsh", zshrcPath: "/.zshrc" }),
    false,
  );
  assert.equal(
    requiresWorkspaceIsolationShellHooks({ enabled: false, supported: true, installed: false, hookPath: "/hook.zsh", zshrcPath: "/.zshrc" }),
    true,
  );
});

test("getWorkspaceIsolationDialogInitialStep skips the intro for edits and ready terminals", () => {
  const stack = {
    id: "stack-1",
    kind: "workspace-isolation" as const,
    name: "demo",
    slug: "demo",
    projectId: "project-1",
    workspaceRootPath: "/repo",
    workspaceRootLabel: "Repository Root",
    projectName: "demo",
    workspaceMode: "single-app" as const,
    createdAt: 1,
    services: [],
  };

  assert.equal(getWorkspaceIsolationDialogInitialStep(stack, null), 2);
  assert.equal(
    getWorkspaceIsolationDialogInitialStep(null, {
      enabled: true,
      supported: true,
      installed: true,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    2,
  );
  assert.equal(
    getWorkspaceIsolationDialogInitialStep(null, {
      enabled: false,
      supported: false,
      installed: false,
      hookPath: null,
      zshrcPath: null,
    }),
    2,
  );
  assert.equal(
    getWorkspaceIsolationDialogInitialStep(null, {
      enabled: false,
      supported: true,
      installed: false,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    1,
  );
});

test("getWorkspaceIsolationDialogOpeningState keeps auto-env setup tied to the dialog opening", () => {
  const stack = {
    id: "stack-1",
    kind: "workspace-isolation" as const,
    name: "demo",
    slug: "demo",
    projectId: "project-1",
    workspaceRootPath: "/repo",
    workspaceRootLabel: "Repository Root",
    projectName: "demo",
    workspaceMode: "single-app" as const,
    createdAt: 1,
    services: [],
  };

  assert.deepEqual(
    getWorkspaceIsolationDialogOpeningState(stack, {
      enabled: false,
      supported: true,
      installed: false,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    { step: 2, requiresAutoEnvSetup: false },
  );
  assert.deepEqual(
    getWorkspaceIsolationDialogOpeningState(null, {
      enabled: false,
      supported: true,
      installed: false,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    { step: 1, requiresAutoEnvSetup: true },
  );
});

test("getWorkspaceIsolationIntroAction only asks to enable hooks when they are still required", () => {
  assert.equal(getWorkspaceIsolationIntroAction(null), "continue");
  assert.equal(
    getWorkspaceIsolationIntroAction({
      enabled: false,
      supported: false,
      installed: false,
      hookPath: null,
      zshrcPath: null,
    }),
    "continue",
  );
  assert.equal(
    getWorkspaceIsolationIntroAction({
      enabled: true,
      supported: true,
      installed: true,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    "continue",
  );
  assert.equal(
    getWorkspaceIsolationIntroAction({
      enabled: false,
      supported: true,
      installed: false,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    "enable-and-continue",
  );
});
