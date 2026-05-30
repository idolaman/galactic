import type {
  CreateWorkspaceConsoleSessionInput,
  CreateWorkspaceConsoleSessionResult,
  WorkspaceConsoleActionResult,
  WorkspaceConsoleEvent,
  WorkspaceConsoleSession,
} from "@/types/workspace-console";

const desktopUnavailable = "Workspace Console is available in the desktop app.";

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number";
const statuses = new Set(["starting", "running", "exited", "error"]);

interface WorkspaceConsoleElectronApi {
  createWorkspaceConsoleSession?: (
    input: CreateWorkspaceConsoleSessionInput,
  ) => Promise<CreateWorkspaceConsoleSessionResult>;
  killWorkspaceConsoleSession?: (sessionId: string) => Promise<WorkspaceConsoleActionResult>;
  listWorkspaceConsoleSessions?: () => Promise<WorkspaceConsoleSession[]>;
  onWorkspaceConsoleEvent?: (callback: (event: unknown) => void) => () => void;
  resizeWorkspaceConsoleSession?: (
    sessionId: string,
    cols: number,
    rows: number,
  ) => Promise<WorkspaceConsoleActionResult>;
  writeWorkspaceConsoleInput?: (
    sessionId: string,
    data: string,
  ) => Promise<WorkspaceConsoleActionResult>;
}

const getElectronApi = (): WorkspaceConsoleElectronApi | undefined =>
  typeof window === "undefined"
    ? undefined
    : (window as Window & { electronAPI?: WorkspaceConsoleElectronApi }).electronAPI;

const isWorkspaceConsoleSession = (value: unknown): value is WorkspaceConsoleSession => {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return (
    isString(session.sessionId) &&
    isString(session.workspacePath) &&
    isString(session.workspaceLabel) &&
    (session.projectName === undefined || isString(session.projectName)) &&
    isString(session.cwd) &&
    isString(session.status) &&
    statuses.has(session.status) &&
    isString(session.title) &&
    isNumber(session.createdAt)
  );
};

export const isWorkspaceConsoleEvent = (value: unknown): value is WorkspaceConsoleEvent => {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  if (event.type === "created") return isWorkspaceConsoleSession(event.session);
  if (event.type === "data") return isString(event.sessionId) && isString(event.data);
  if (event.type === "title") return isString(event.sessionId) && isString(event.title);
  if (event.type === "error") return isString(event.sessionId) && isString(event.error);
  if (event.type === "removed") return isString(event.sessionId);
  if (event.type === "exit") {
    return (
      isString(event.sessionId) &&
      isNumber(event.exitCode) &&
      (event.signal === undefined || isNumber(event.signal))
    );
  }
  return false;
};

export const createWorkspaceConsoleSession = async (
  input: CreateWorkspaceConsoleSessionInput,
): Promise<CreateWorkspaceConsoleSessionResult> =>
  getElectronApi()?.createWorkspaceConsoleSession?.(input) ?? {
    success: false,
    error: desktopUnavailable,
  };

export const listWorkspaceConsoleSessions = async (): Promise<WorkspaceConsoleSession[]> =>
  getElectronApi()?.listWorkspaceConsoleSessions?.() ?? [];

export const writeWorkspaceConsoleInput = async (
  sessionId: string,
  data: string,
): Promise<WorkspaceConsoleActionResult> =>
  getElectronApi()?.writeWorkspaceConsoleInput?.(sessionId, data) ?? {
    success: false,
    error: desktopUnavailable,
  };

export const resizeWorkspaceConsoleSession = async (
  sessionId: string,
  cols: number,
  rows: number,
): Promise<WorkspaceConsoleActionResult> =>
  getElectronApi()?.resizeWorkspaceConsoleSession?.(sessionId, cols, rows) ?? {
    success: false,
    error: desktopUnavailable,
  };

export const killWorkspaceConsoleSession = async (
  sessionId: string,
): Promise<WorkspaceConsoleActionResult> =>
  getElectronApi()?.killWorkspaceConsoleSession?.(sessionId) ?? {
    success: false,
    error: desktopUnavailable,
  };

export const onWorkspaceConsoleEvent = (
  callback: (event: WorkspaceConsoleEvent) => void,
): (() => void) =>
  getElectronApi()?.onWorkspaceConsoleEvent?.((event) => {
    if (isWorkspaceConsoleEvent(event)) callback(event);
  }) ?? (() => undefined);
