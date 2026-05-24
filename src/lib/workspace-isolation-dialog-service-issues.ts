import { normalizeRelativeServicePath } from "./workspace-isolation-helpers.js";
import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationService,
} from "../types/workspace-isolation.js";

export type WorkspaceIsolationDraftServiceIssues = Record<string, string>;

export const getWorkspaceIsolationDraftServiceIssues = (
  workspaceMode: WorkspaceIsolationMode,
  draftServices: WorkspaceIsolationService[],
): WorkspaceIsolationDraftServiceIssues => {
  if (workspaceMode === "single-app") {
    return {};
  }

  const pathCounts = draftServices.reduce<Record<string, number>>(
    (counts, service) => {
      const normalizedPath = normalizeRelativeServicePath(service.relativePath);
      return { ...counts, [normalizedPath]: (counts[normalizedPath] ?? 0) + 1 };
    },
    {},
  );

  return draftServices.reduce<WorkspaceIsolationDraftServiceIssues>(
    (issues, service) => {
      const normalizedPath = normalizeRelativeServicePath(service.relativePath);
      if (normalizedPath === ".") {
        return { ...issues, [service.id]: "Enter a relative folder like apps/web." };
      }
      if ((pathCounts[normalizedPath] ?? 0) > 1) {
        return { ...issues, [service.id]: "Each service needs a unique folder." };
      }

      return issues;
    },
    {},
  );
};
