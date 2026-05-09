import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createAuthStorage } from "../utils/auth-storage.js";

const createTempDir = () => mkdtemp(path.join(os.tmpdir(), "galactic-auth-storage-"));

const createSafeStorage = (available = true) => ({
  decryptString: (encryptedBuffer: Buffer) =>
    Buffer.from(encryptedBuffer.toString(), "base64").toString("utf-8"),
  encryptString: (plainText: string) => Buffer.from(Buffer.from(plainText).toString("base64")),
  isEncryptionAvailable: () => available,
});

test("auth storage persists encrypted values when safe storage is available", async () => {
  const tempDir = await createTempDir();
  const storagePath = path.join(tempDir, "auth-storage.enc");

  try {
    const storage = createAuthStorage({ safeStorage: createSafeStorage(), storagePath });
    await storage.setItem("token", "secret");

    assert.equal(await storage.getItem("token"), "secret");
    assert.notEqual(await readFile(storagePath, "utf-8"), JSON.stringify({ token: "secret" }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("auth storage removes values", async () => {
  const tempDir = await createTempDir();
  const storagePath = path.join(tempDir, "auth-storage.enc");

  try {
    const storage = createAuthStorage({ safeStorage: createSafeStorage(), storagePath });
    await storage.setItem("token", "secret");
    await storage.removeItem("token");

    assert.equal(await storage.getItem("token"), null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("auth storage ignores corrupt encrypted files", async () => {
  const tempDir = await createTempDir();
  const storagePath = path.join(tempDir, "auth-storage.enc");

  try {
    await writeFile(storagePath, "not-base64-json", "utf-8");
    const storage = createAuthStorage({ safeStorage: createSafeStorage(), storagePath });

    assert.equal(await storage.getItem("token"), null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("auth storage falls back to memory when encryption is unavailable", async () => {
  const tempDir = await createTempDir();
  const storagePath = path.join(tempDir, "auth-storage.enc");

  try {
    const storage = createAuthStorage({ safeStorage: createSafeStorage(false), storagePath });
    await storage.setItem("memory-token", "secret");

    assert.equal(await storage.getItem("memory-token"), "secret");
    await assert.rejects(readFile(storagePath, "utf-8"));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
