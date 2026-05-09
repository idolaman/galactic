import assert from "node:assert/strict";
import test from "node:test";

import {
  claimLegacyLocalStorageMigration,
  getLegacyLocalStorageKey,
} from "../../src/services/local-storage-migration.js";
import {
  ACTIVE_USER_ID_STORAGE_KEY,
  LOCAL_STORAGE_MIGRATION_CLAIM_KEY,
  clearActiveLocalStorageUserId,
  getActiveLocalStorageUserId,
  getProductStorageKey,
  getScopedLocalStorageKey,
  isActiveLocalStorageDatasetKey,
  setActiveLocalStorageUserId,
} from "../../src/services/local-storage-scope.js";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const installWindow = (): MemoryStorage => {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { dispatchEvent: () => true, localStorage: storage },
  });
  return storage;
};

const legacyProjects = JSON.stringify([
  {
    id: "project-1",
    isGitRepo: true,
    name: "Legacy Project",
    path: "/repo",
    workspaces: [{ name: "Feature", workspace: "/repo-feature" }],
    worktrees: 1,
  },
]);
const legacyEnvironments = JSON.stringify([
  { address: "127.0.0.2", bindings: [], createdAt: 1, id: "env-1", name: "Dev" },
]);

test.afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

test("first signed-in user claims legacy projects and environments", () => {
  const storage = installWindow();
  storage.setItem(getLegacyLocalStorageKey("projects"), legacyProjects);
  storage.setItem(getLegacyLocalStorageKey("environments"), legacyEnvironments);

  claimLegacyLocalStorageMigration("user-1");
  setActiveLocalStorageUserId("user-1");

  assert.equal(storage.getItem(getScopedLocalStorageKey("user-1", "projects")), legacyProjects);
  assert.equal(storage.getItem(getScopedLocalStorageKey("user-1", "environments")), legacyEnvironments);
  assert.equal(storage.getItem(getLegacyLocalStorageKey("projects")), legacyProjects);
  assert.equal(storage.getItem(LOCAL_STORAGE_MIGRATION_CLAIM_KEY), "user-1");
  assert.equal(getProductStorageKey("projects"), getScopedLocalStorageKey("user-1", "projects"));
});

test("second signed-in user after the claim starts with empty scoped data", () => {
  const storage = installWindow();
  storage.setItem(getLegacyLocalStorageKey("projects"), legacyProjects);

  claimLegacyLocalStorageMigration("user-1");
  setActiveLocalStorageUserId("user-2");

  assert.equal(getProductStorageKey("projects"), getScopedLocalStorageKey("user-2", "projects"));
  assert.equal(storage.getItem(getScopedLocalStorageKey("user-2", "projects")), null);
  assert.equal(storage.getItem(getScopedLocalStorageKey("user-2", "environments")), null);
});

test("product storage keys require an active signed-in user", () => {
  const storage = installWindow();
  storage.setItem(getLegacyLocalStorageKey("projects"), legacyProjects);

  assert.throws(
    () => getProductStorageKey("projects"),
    /Product storage requires an active signed-in user/,
  );
});

test("runtime storage events only match the active user's scoped keys", () => {
  installWindow();
  setActiveLocalStorageUserId("user-1");

  assert.equal(
    isActiveLocalStorageDatasetKey(getScopedLocalStorageKey("user-1", "projects"), "projects"),
    true,
  );
  assert.equal(
    isActiveLocalStorageDatasetKey(getScopedLocalStorageKey("user-2", "projects"), "projects"),
    false,
  );
  assert.equal(
    isActiveLocalStorageDatasetKey(getLegacyLocalStorageKey("projects"), "projects"),
    false,
  );
});

test("migration does not overwrite existing scoped product data", () => {
  const storage = installWindow();
  const scopedProjects = JSON.stringify([{ id: "scoped-project" }]);
  const scopedEnvironments = JSON.stringify([{ id: "scoped-env" }]);
  storage.setItem(getLegacyLocalStorageKey("projects"), legacyProjects);
  storage.setItem(getLegacyLocalStorageKey("environments"), legacyEnvironments);
  storage.setItem(getScopedLocalStorageKey("user-1", "projects"), scopedProjects);
  storage.setItem(getScopedLocalStorageKey("user-1", "environments"), scopedEnvironments);

  claimLegacyLocalStorageMigration("user-1");

  assert.equal(storage.getItem(getScopedLocalStorageKey("user-1", "projects")), scopedProjects);
  assert.equal(storage.getItem(getScopedLocalStorageKey("user-1", "environments")), scopedEnvironments);
});

test("invalid legacy JSON is treated as empty and still claims migration", () => {
  const storage = installWindow();
  storage.setItem(getLegacyLocalStorageKey("projects"), "{");
  storage.setItem(getLegacyLocalStorageKey("environments"), JSON.stringify({ id: "not-array" }));

  assert.doesNotThrow(() => claimLegacyLocalStorageMigration("user-1"));

  assert.equal(storage.getItem(getScopedLocalStorageKey("user-1", "projects")), "[]");
  assert.equal(storage.getItem(getScopedLocalStorageKey("user-1", "environments")), "[]");
  assert.equal(storage.getItem(LOCAL_STORAGE_MIGRATION_CLAIM_KEY), "user-1");
});

test("sign-out clears active user and stops reading legacy keys after claim", () => {
  const storage = installWindow();
  storage.setItem(ACTIVE_USER_ID_STORAGE_KEY, "user-1");
  storage.setItem(LOCAL_STORAGE_MIGRATION_CLAIM_KEY, "user-1");

  clearActiveLocalStorageUserId();

  assert.equal(getActiveLocalStorageUserId(), null);
  assert.throws(
    () => getProductStorageKey("projects"),
    /Product storage requires an active signed-in user/,
  );
});
