export const asTrimmedString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const parseEnvFile = (content: string): Record<string, string> => {
  const values: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    values[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
  }

  return values;
};

export const getFirstEnvValue = (
  values: Record<string, string>,
  ...keys: string[]
): string => {
  for (const key of keys) {
    const value = asTrimmedString(values[key]);
    if (value) return value;
  }
  return "";
};
