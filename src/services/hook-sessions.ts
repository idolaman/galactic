import type { SessionSummary } from "@/types/session";

export const readHookSessions = async (): Promise<SessionSummary[]> => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return (await window.electronAPI?.getHookSessions?.()) ?? [];
  } catch (error) {
    console.error("Failed to read hook sessions", error);
    return [];
  }
};
