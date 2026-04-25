import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceIsolationDialogOpeningState,
  requiresWorkspaceIsolationShellHooks,
} from "../../src/lib/workspace-isolation-dialog-step.js";

test("requiresWorkspaceIsolationShellHooks only blocks when hooks are supported and disabled", () => {
  assert.equal(requiresWorkspaceIsolationShellHooks(null), false);
  assert.equal(
    requiresWorkspaceIsolationShellHooks({
      enabled: false,
      supported: false,
      installed: false,
      hookPath: null,
      zshrcPath: null,
    }),
    false,
  );
  assert.equal(
    requiresWorkspaceIsolationShellHooks({
      enabled: true,
      supported: true,
      installed: true,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    false,
  );
  assert.equal(
    requiresWorkspaceIsolationShellHooks({
      enabled: false,
      supported: true,
      installed: false,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    true,
  );
});

test("opening state skips onboarding when auto-env is already ready", () => {
  assert.deepEqual(
    getWorkspaceIsolationDialogOpeningState(
      {
        enabled: true,
        supported: true,
        installed: true,
        hookPath: "/hook.zsh",
        zshrcPath: "/.zshrc",
      },
      false,
    ),
    {
      step: 3,
      showFeatureIntroStep: false,
      requiresAutoEnvSetup: false,
    },
  );
  assert.deepEqual(
    getWorkspaceIsolationDialogOpeningState(
      {
        enabled: false,
        supported: false,
        installed: false,
        hookPath: null,
        zshrcPath: null,
      },
      false,
    ),
    {
      step: 3,
      showFeatureIntroStep: false,
      requiresAutoEnvSetup: false,
    },
  );
});

test("opening state shows feature intro first for first-time users who still need auto-env", () => {
  assert.deepEqual(
    getWorkspaceIsolationDialogOpeningState(
      {
        enabled: false,
        supported: true,
        installed: false,
        hookPath: "/hook.zsh",
        zshrcPath: "/.zshrc",
      },
      false,
    ),
    {
      step: 1,
      showFeatureIntroStep: true,
      requiresAutoEnvSetup: true,
    },
  );
});

test("opening state skips the feature intro after it has been seen once", () => {
  assert.deepEqual(
    getWorkspaceIsolationDialogOpeningState(
      {
        enabled: false,
        supported: true,
        installed: false,
        hookPath: "/hook.zsh",
        zshrcPath: "/.zshrc",
      },
      true,
    ),
    {
      step: 2,
      showFeatureIntroStep: false,
      requiresAutoEnvSetup: true,
    },
  );
});
