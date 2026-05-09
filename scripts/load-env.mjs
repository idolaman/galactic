import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const parseLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const normalized = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length).trim()
    : trimmed;
  const separatorIndex = normalized.indexOf("=");
  if (separatorIndex <= 0) return null;

  const key = normalized.slice(0, separatorIndex).trim();
  const rawValue = normalized.slice(separatorIndex + 1).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;

  const quoted =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"));
  const value = quoted ? rawValue.slice(1, -1) : rawValue.replace(/\s+#.*$/, "");

  return { key, value };
};

export const loadLocalEnv = (cwd = process.cwd()) => {
  const originalKeys = new Set(Object.keys(process.env));
  const parsedValues = new Map();

  [".env", ".env.local"].forEach((fileName) => {
    const filePath = path.join(cwd, fileName);
    if (!existsSync(filePath)) return;

    readFileSync(filePath, "utf-8")
      .split(/\r?\n/)
      .map(parseLine)
      .filter(Boolean)
      .forEach(({ key, value }) => parsedValues.set(key, value));
  });

  parsedValues.forEach((value, key) => {
    if (!originalKeys.has(key)) {
      process.env[key] = value;
    }
  });
};
