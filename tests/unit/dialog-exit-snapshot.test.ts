import assert from "node:assert/strict";
import test from "node:test";
import {
  getNextDialogSnapshot,
  shouldClearDialogSnapshotAfterExit,
} from "../../src/lib/dialog-exit-snapshot.js";

test("dialog exit snapshot keeps previous data while source is cleared", () => {
  assert.deepEqual(
    getNextDialogSnapshot(null, { id: "project-1" }),
    { id: "project-1" },
  );
});

test("dialog exit snapshot updates immediately when reopened with new data", () => {
  assert.deepEqual(
    getNextDialogSnapshot({ id: "project-2" }, { id: "project-1" }),
    { id: "project-2" },
  );
});

test("dialog exit snapshot clears only when source is still null on exit", () => {
  assert.equal(shouldClearDialogSnapshotAfterExit(null), true);
  assert.equal(shouldClearDialogSnapshotAfterExit({ id: "project-1" }), false);
});
