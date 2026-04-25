import { WORKSPACE_ISOLATION_PROXY_PORT } from "@/lib/workspace-isolation-helpers";
import type {
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";
import type {
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationShellHookStatus,
} from "@/types/electron";

export const workspaceIsolationDesktopUnavailable =
  "Workspace Isolation is only available in the desktop app.";

export const workspaceIsolationIpcUnavailable =
  "Workspace Isolation IPC bridge is unavailable.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isWorkspaceIsolationService = (
  value: unknown,
): value is WorkspaceIsolationService =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  typeof value.slug === "string" &&
  typeof value.relativePath === "string" &&
  typeof value.port === "number" &&
  typeof value.createdAt === "number" &&
  Array.isArray(value.connections);

export const isWorkspaceIsolationStack = (
  value: unknown,
): value is WorkspaceIsolationStack =>
  isRecord(value) &&
  value.kind === "workspace-isolation" &&
  typeof value.id === "string" &&
  typeof value.projectId === "string" &&
  typeof value.workspaceRootPath === "string" &&
  typeof value.workspaceRootLabel === "string" &&
  typeof value.projectName === "string" &&
  Array.isArray(value.services) &&
  value.services.every(isWorkspaceIsolationService);

export const isWorkspaceIsolationProjectTopology = (
  value: unknown,
): value is WorkspaceIsolationProjectTopology =>
  isWorkspaceIsolationStack(value);

export const toWorkspaceIsolationStacks = (
  value: unknown,
): WorkspaceIsolationStack[] =>
  Array.isArray(value) ? value.filter(isWorkspaceIsolationStack) : [];

export const toWorkspaceIsolationProjectTopologies = (
  value: unknown,
): WorkspaceIsolationProjectTopology[] =>
  Array.isArray(value)
    ? value.filter(isWorkspaceIsolationProjectTopology)
    : [];

export const isWorkspaceIsolationProxyStatus = (
  value: unknown,
): value is WorkspaceIsolationProxyStatus =>
  isRecord(value) &&
  typeof value.running === "boolean" &&
  typeof value.port === "number";

export const isWorkspaceIsolationShellHookStatus = (
  value: unknown,
): value is WorkspaceIsolationShellHookStatus =>
  isRecord(value) &&
  typeof value.enabled === "boolean" &&
  typeof value.supported === "boolean" &&
  typeof value.installed === "boolean";

export const defaultProxyStatus = (
  message = "Workspace Isolation proxy status is unavailable.",
): WorkspaceIsolationProxyStatus => ({
  running: false,
  port: WORKSPACE_ISOLATION_PROXY_PORT,
  message,
});

export const defaultShellHookStatus = (
  message = "Workspace Isolation shell hook status is unavailable.",
): WorkspaceIsolationShellHookStatus => ({
  enabled: false,
  supported: false,
  installed: false,
  hookPath: null,
  zshrcPath: null,
  message,
});

export const getWorkspaceIsolationErrorMessage = (
  error: unknown,
  fallback: string,
): string => error instanceof Error ? error.message : fallback;
