import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ensureNodePtySpawnHelperExecutable,
} from "../workspace-console/pty-adapter.js";

test("ensureNodePtySpawnHelperExecutable repairs missing helper execute bits", () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "galactic-pty-"));
  const helperPath = path.join(tempDir, "spawn-helper");

  try {
    writeFileSync(helperPath, "#!/bin/sh\n");
    chmodSync(helperPath, 0o644);

    ensureNodePtySpawnHelperExecutable(helperPath);

    assert.equal((statSync(helperPath).mode & 0o111) !== 0, true);
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test("ensureNodePtySpawnHelperExecutable ignores missing helper paths", () => {
  assert.doesNotThrow(() => ensureNodePtySpawnHelperExecutable(null));
});
