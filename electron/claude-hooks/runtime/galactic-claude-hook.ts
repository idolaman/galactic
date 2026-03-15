import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import type { ClaudeHookEvent } from "../types.js";

interface ActiveRunRecord {
  id: string;
}

type ActiveRunMap = Record<string, ActiveRunRecord>;

const getStatePaths = (homeDir: string = os.homedir()) => {
  const root = path.join(homeDir, ".galactic", "platforms", "claude", "state");
  return {
    root,
    eventLogPath: path.join(root, "agent-events.ndjson"),
    activeRunsPath: path.join(root, "active-runs.json"),
  };
};

const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
};

const readStdin = async (): Promise<string> => {
  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(String(chunk));
  }
  return chunks.join("").trim();
};

const toTitle = (prompt: unknown): string => {
  const value = typeof prompt === "string" ? prompt.trim().replace(/\s+/g, " ") : "";
  return value ? value.slice(0, 96) : "Claude task";
};

const isInterrupt = (payload: Record<string, unknown>): boolean =>
  payload.is_interrupt === true || payload.isInterrupt === true || payload.reason === "cancelled";

export const normalizeHookPayload = (
  payload: Record<string, unknown>,
  activeRuns: ActiveRunMap,
  now: string,
): { events: ClaudeHookEvent[]; activeRuns: ActiveRunMap } => {
  const hookEventName = typeof payload.hook_event_name === "string" ? payload.hook_event_name : "";
  const chatId = typeof payload.session_id === "string" ? payload.session_id : "";
  const nextActiveRuns = { ...activeRuns };
  const activeRun = chatId ? nextActiveRuns[chatId] : undefined;

  if (!chatId || hookEventName === "SessionStart") {
    return { events: [], activeRuns: nextActiveRuns };
  }

  if (hookEventName === "UserPromptSubmit") {
    const id = randomUUID();
    nextActiveRuns[chatId] = { id };
    return {
      events: [{
        event: "session.started",
        id,
        chat_id: chatId,
        title: toTitle(payload.prompt),
        started_at: now,
        platform: "claude",
        workspace_path: typeof payload.cwd === "string" ? payload.cwd : undefined,
      }],
      activeRuns: nextActiveRuns,
    };
  }

  if (!activeRun) {
    return { events: [], activeRuns: nextActiveRuns };
  }

  if (hookEventName === "PermissionRequest") {
    return { events: [{ event: "approval.pending", id: activeRun.id, at: now }], activeRuns: nextActiveRuns };
  }

  if (hookEventName === "PostToolUse") {
    return { events: [{ event: "approval.cleared", id: activeRun.id }], activeRuns: nextActiveRuns };
  }

  if (hookEventName === "PostToolUseFailure") {
    const events: ClaudeHookEvent[] = [{ event: "approval.cleared", id: activeRun.id }];
    if (isInterrupt(payload)) {
      events.push({ event: "session.finished", id: activeRun.id, ended_at: now });
      delete nextActiveRuns[chatId];
    }
    return { events, activeRuns: nextActiveRuns };
  }

  if (hookEventName === "Stop" || hookEventName === "SessionEnd") {
    delete nextActiveRuns[chatId];
    return {
      events: [{ event: "session.finished", id: activeRun.id, ended_at: now }],
      activeRuns: nextActiveRuns,
    };
  }

  return { events: [], activeRuns: nextActiveRuns };
};

export const runClaudeHookCli = async (homeDir: string = os.homedir()): Promise<void> => {
  const rawInput = await readStdin();
  if (!rawInput) {
    return;
  }

  const payload = JSON.parse(rawInput) as Record<string, unknown>;
  const paths = getStatePaths(homeDir);
  const activeRuns = await readJson<ActiveRunMap>(paths.activeRunsPath, {});
  const { events, activeRuns: nextActiveRuns } = normalizeHookPayload(payload, activeRuns, new Date().toISOString());
  if (events.length === 0) {
    return;
  }

  await fs.mkdir(paths.root, { recursive: true });
  await fs.appendFile(paths.eventLogPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
  await fs.writeFile(paths.activeRunsPath, JSON.stringify(nextActiveRuns, null, 2), "utf8");
};

const isMainModule = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isMainModule) {
  void runClaudeHookCli().catch((error) => {
    console.error("Galactic Claude hook failed:", error);
    process.exitCode = 1;
  });
}
