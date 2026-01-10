// Timebomb service for alpha version expiration control

const GIST_API_URL =
  "https://api.github.com/gists/02b1b8a5dccb3abec100157fa9f35f8a";

export interface TimebombConfig {
  kill: boolean;
  expiration_date: string;
  message?: string;
}

export interface TimebombStatus {
  isExpired: boolean;
  isKilled: boolean;
  expirationDate: string | null;
  message: string | null;
  error: string | null;
}

interface GistFile {
  content?: string;
}

interface GistResponse {
  files?: Record<string, GistFile>;
}

function isValidConfig(data: unknown): data is TimebombConfig {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.kill === "boolean" && typeof obj.expiration_date === "string";
}

function isDateExpired(dateString: string): boolean {
  const expiry = new Date(dateString);
  if (isNaN(expiry.getTime())) return false;
  return new Date() > expiry;
}

export async function fetchTimebombStatus(): Promise<TimebombStatus> {
  try {
    const response = await fetch(GIST_API_URL, { cache: "no-store" });
    if (!response.ok) {
      return { isExpired: false, isKilled: false, expirationDate: null, message: null, error: "Failed to fetch config" };
    }

    const gist = (await response.json()) as GistResponse;
    const fileContent = gist.files?.["galactic-expiry.json"]?.content;
    if (!fileContent) {
      return { isExpired: false, isKilled: false, expirationDate: null, message: null, error: "Config file not found" };
    }

    const data: unknown = JSON.parse(fileContent);
    if (!isValidConfig(data)) {
      return { isExpired: false, isKilled: false, expirationDate: null, message: null, error: "Invalid config format" };
    }

    return {
      isExpired: isDateExpired(data.expiration_date),
      isKilled: data.kill,
      expirationDate: data.expiration_date,
      message: data.message?.trim() || null,
      error: null,
    };
  } catch {
    return { isExpired: false, isKilled: false, expirationDate: null, message: null, error: "Network error" };
  }
}
