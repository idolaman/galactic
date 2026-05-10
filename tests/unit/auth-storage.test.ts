import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
  getAuthStorageItem,
  removeAuthStorageItem,
  setAuthStorageItem,
} from "../../src/services/auth-storage.js";

const clearWindow = () => {
  Reflect.deleteProperty(globalThis, "window");
};

afterEach(() => {
  clearWindow();
});

test("auth storage falls back to memory only when Electron auth storage is unavailable", async () => {
  await setAuthStorageItem("memory-token", "secret");

  assert.equal(await getAuthStorageItem("memory-token"), "secret");

  await removeAuthStorageItem("memory-token");

  assert.equal(await getAuthStorageItem("memory-token"), null);
});

test("auth storage throws Electron write failures instead of falling back", async () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      electronAPI: {
        setAuthStorageItem: async () => {
          throw new Error("write failed");
        },
      },
    },
  });

  await assert.rejects(
    () => setAuthStorageItem("write-fail-token", "secret"),
    /write failed/,
  );

  clearWindow();

  assert.equal(await getAuthStorageItem("write-fail-token"), null);
});

test("auth storage throws Electron read failures", async () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      electronAPI: {
        getAuthStorageItem: async () => {
          throw new Error("read failed");
        },
      },
    },
  });

  await assert.rejects(() => getAuthStorageItem("read-fail-token"), /read failed/);
});

test("auth storage keeps memory data when Electron remove fails", async () => {
  await setAuthStorageItem("remove-fail-token", "secret");

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      electronAPI: {
        removeAuthStorageItem: async () => {
          throw new Error("remove failed");
        },
      },
    },
  });

  await assert.rejects(
    () => removeAuthStorageItem("remove-fail-token"),
    /remove failed/,
  );

  clearWindow();

  assert.equal(await getAuthStorageItem("remove-fail-token"), "secret");

  await removeAuthStorageItem("remove-fail-token");
});
