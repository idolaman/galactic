import assert from "node:assert/strict";
import test from "node:test";
import {
  loadAsyncToggleSettingValue,
  saveAsyncToggleSettingValue,
} from "../../src/lib/async-toggle-setting.js";

test("loadAsyncToggleSettingValue reports load failures while mounted", async () => {
  let didReportError = false;
  let didSettle = false;

  await loadAsyncToggleSettingValue({
    getValue: async () => Promise.reject(new Error("load failed")),
    isMounted: () => true,
    onError: () => {
      didReportError = true;
    },
    onLoaded: () => {
      throw new Error("load success should not run");
    },
    onSettled: () => {
      didSettle = true;
    },
  });

  assert.equal(didReportError, true);
  assert.equal(didSettle, true);
});

test("saveAsyncToggleSettingValue restores the previous value when save throws", async () => {
  const changes: boolean[] = [];
  const errors: string[] = [];

  await saveAsyncToggleSettingValue({
    fallbackErrorMessage: "Save failed.",
    nextValue: true,
    onChanged: (enabled) => {
      changes.push(enabled);
    },
    onError: (message) => {
      errors.push(message);
    },
    previousValue: false,
    setValue: async () => Promise.reject(new Error("save failed")),
  });

  assert.deepEqual(changes, [true, false]);
  assert.deepEqual(errors, ["Save failed."]);
});

test("saveAsyncToggleSettingValue uses the returned error when save is rejected by result", async () => {
  const changes: boolean[] = [];
  const errors: string[] = [];

  await saveAsyncToggleSettingValue({
    fallbackErrorMessage: "Save failed.",
    nextValue: true,
    onChanged: (enabled) => {
      changes.push(enabled);
    },
    onError: (message) => {
      errors.push(message);
    },
    previousValue: false,
    setValue: async () => ({
      success: false,
      enabled: false,
      error: "Server rejected the update.",
    }),
  });

  assert.deepEqual(changes, [true, false]);
  assert.deepEqual(errors, ["Server rejected the update."]);
});
