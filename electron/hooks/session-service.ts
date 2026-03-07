import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import { getHookEventLogPath } from "./paths.js";
import { reduceHookEventsToSessions } from "./session-reducer.js";
import type { GalacticHookEvent, HookSessionSummary } from "./types.js";

const parseEventLine = (line: string): GalacticHookEvent | null => {
  if (!line.trim()) {
    return null;
  }

  try {
    return JSON.parse(line) as GalacticHookEvent;
  } catch {
    return null;
  }
};

export const readHookSessions = async (homeDirectory?: string): Promise<HookSessionSummary[]> => {
  const logPath = getHookEventLogPath(homeDirectory);
  if (!existsSync(logPath)) {
    return [];
  }

  try {
    const content = await fs.readFile(logPath, "utf8");
    const events = content
      .split(/\r?\n/)
      .map(parseEventLine)
      .filter((event): event is GalacticHookEvent => Boolean(event));
    return reduceHookEventsToSessions(events);
  } catch {
    return [];
  }
};
