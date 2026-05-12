import assert from "node:assert/strict";
import { createCipheriv, randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createAuthStorage } from "../utils/auth-storage.js";

const createTempDir = () => mkdtemp(path.join(os.tmpdir(), "galactic-auth-storage-"));

const getStoragePaths = (tempDir: string) => ({
  keyPath: path.join(tempDir, "auth-storage.key"),
  storagePath: path.join(tempDir, "auth-storage.enc"),
});

const writeEncryptedFixture = async (
  storagePath: string,
  keyPath: string,
  value: unknown,
) => {
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf-8"),
    cipher.final(),
  ]);

  await writeFile(keyPath, key.toString("base64"), { encoding: "utf-8", mode: 0o600 });
  await writeFile(
    storagePath,
    JSON.stringify({
      ciphertext: ciphertext.toString("base64"),
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      version: 2,
    }),
    "utf-8",
  );
};

test("auth storage persists encrypted values across storage instances", async () => {
  const tempDir = await createTempDir();
  const { keyPath, storagePath } = getStoragePaths(tempDir);
  const tokenValue = "supabase-token-plaintext-value";

  try {
    const storage = createAuthStorage({ keyPath, storagePath });
    await storage.setItem("token", tokenValue);

    const restoredStorage = createAuthStorage({ keyPath, storagePath });
    assert.equal(await restoredStorage.getItem("token"), tokenValue);
    assert.equal((await readFile(storagePath, "utf-8")).includes(tokenValue), false);

    if (process.platform !== "win32") {
      assert.equal((await stat(keyPath)).mode & 0o777, 0o600);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("auth storage removes values", async () => {
  const tempDir = await createTempDir();
  const { keyPath, storagePath } = getStoragePaths(tempDir);

  try {
    const storage = createAuthStorage({ keyPath, storagePath });
    await storage.setItem("token", "secret");
    await storage.removeItem("token");

    assert.equal(await storage.getItem("token"), null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("auth storage ignores corrupt encrypted files", async () => {
  const tempDir = await createTempDir();
  const { keyPath, storagePath } = getStoragePaths(tempDir);

  try {
    await writeFile(keyPath, randomBytes(32).toString("base64"), "utf-8");
    await writeFile(storagePath, "not-json", "utf-8");
    const storage = createAuthStorage({ keyPath, storagePath });

    assert.equal(await storage.getItem("token"), null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("auth storage treats invalid decrypted shape as empty", async () => {
  const tempDir = await createTempDir();
  const { keyPath, storagePath } = getStoragePaths(tempDir);

  try {
    await writeEncryptedFixture(storagePath, keyPath, ["token"]);
    const storage = createAuthStorage({ keyPath, storagePath });

    assert.equal(await storage.getItem("0"), null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("auth storage returns empty state when storage cannot be decrypted", async () => {
  const tempDir = await createTempDir();
  const { keyPath, storagePath } = getStoragePaths(tempDir);

  try {
    const storage = createAuthStorage({ keyPath, storagePath });
    await storage.setItem("token", "secret");
    await writeFile(keyPath, randomBytes(32).toString("base64"), "utf-8");

    assert.equal(await storage.getItem("token"), null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("auth storage does not fall back to memory when files are missing", async () => {
  const tempDir = await createTempDir();
  const { keyPath, storagePath } = getStoragePaths(tempDir);

  try {
    const storage = createAuthStorage({ keyPath, storagePath });
    await storage.setItem("token", "secret");
    await rm(storagePath);

    assert.equal(await storage.getItem("token"), null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
