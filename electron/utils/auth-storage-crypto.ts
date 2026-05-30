import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";

interface EncryptedAuthStorageFile {
  ciphertext: string;
  iv: string;
  tag: string;
  version: 2;
}

const ALGORITHM = "aes-256-gcm";
const AUTH_STORAGE_VERSION = 2;
const KEY_BYTES = 32;
const IV_BYTES = 12;
const KEY_FILE_MODE = 0o600;
const warnedMissingStoragePaths = new Set<string>();

const warnMissingStorageOnce = (storagePath: string): void => {
  if (warnedMissingStoragePaths.has(storagePath)) return;
  warnedMissingStoragePaths.add(storagePath);
  console.warn("[AuthStorage] Auth storage file is missing.");
};

const isRecord = (value: unknown): value is Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
};

const isEncryptedAuthStorageFile = (
  value: unknown,
): value is EncryptedAuthStorageFile => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<EncryptedAuthStorageFile>;
  return (
    candidate.version === AUTH_STORAGE_VERSION &&
    typeof candidate.iv === "string" &&
    typeof candidate.tag === "string" &&
    typeof candidate.ciphertext === "string"
  );
};

const readAuthKey = async (keyPath: string): Promise<Buffer | null> => {
  if (!existsSync(keyPath)) return null;

  try {
    const key = Buffer.from((await fsPromises.readFile(keyPath, "utf-8")).trim(), "base64");
    if (key.length === KEY_BYTES) return key;
    console.warn("[AuthStorage] Ignoring invalid auth storage key.");
  } catch (error) {
    console.warn("[AuthStorage] Failed to read auth storage key:", error);
  }
  return null;
};

const writeAuthKey = async (keyPath: string, key: Buffer): Promise<void> => {
  await fsPromises.mkdir(path.dirname(keyPath), { recursive: true });
  await fsPromises.writeFile(keyPath, key.toString("base64"), {
    encoding: "utf-8",
    mode: KEY_FILE_MODE,
  });
  await fsPromises.chmod(keyPath, KEY_FILE_MODE).catch((error) => {
    console.warn("[AuthStorage] Failed to restrict auth storage key permissions:", error);
  });
};

const getOrCreateAuthKey = async (keyPath: string): Promise<Buffer> => {
  const existingKey = await readAuthKey(keyPath);
  if (existingKey) return existingKey;

  const key = randomBytes(KEY_BYTES);
  await writeAuthKey(keyPath, key);
  return key;
};

const decryptStorageFile = (rawStorage: string, key: Buffer): Record<string, string> => {
  const encrypted = JSON.parse(rawStorage) as unknown;
  if (!isEncryptedAuthStorageFile(encrypted)) {
    throw new Error("Invalid encrypted auth storage file.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encrypted.iv, "base64"));
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf-8");
  const parsed = JSON.parse(plaintext) as unknown;
  if (isRecord(parsed)) return parsed;

  console.warn("[AuthStorage] Ignoring invalid decrypted auth storage shape.");
  return {};
};

export const readEncryptedAuthStorage = async (
  storagePath: string,
  keyPath: string,
): Promise<Record<string, string>> => {
  if (!existsSync(storagePath)) {
    warnMissingStorageOnce(storagePath);
    return {};
  }

  const key = await readAuthKey(keyPath);
  if (!key) {
    console.warn("[AuthStorage] Auth storage key is missing or invalid.");
    return {};
  }

  try {
    return decryptStorageFile(await fsPromises.readFile(storagePath, "utf-8"), key);
  } catch (error) {
    console.warn("[AuthStorage] Failed to read encrypted auth storage:", error);
    return {};
  }
};

export const writeEncryptedAuthStorage = async (
  storagePath: string,
  keyPath: string,
  values: Record<string, string>,
): Promise<void> => {
  await fsPromises.mkdir(path.dirname(storagePath), { recursive: true });
  const key = await getOrCreateAuthKey(keyPath);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(values), "utf-8"),
    cipher.final(),
  ]);

  const encrypted: EncryptedAuthStorageFile = {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    version: AUTH_STORAGE_VERSION,
  };
  await fsPromises.writeFile(storagePath, JSON.stringify(encrypted), "utf-8");
};
