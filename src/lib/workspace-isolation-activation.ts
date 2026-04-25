import { normalizeWorkspaceRootPath } from "./workspace-isolation-helpers.js";
import type { Workspace } from "../types/workspace.js";
import type {
  WorkspaceActivationTarget,
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

interface CreateWorkspaceActivationTargetsParams {
  workspaceRootPath: string;
  workspaceRootLabel: string;
  workspaces: Workspace[];
  workspaceIsolationStacks: Pick<WorkspaceIsolationStack, "workspaceRootPath">[];
}

const isActiveWorkspaceTarget = (
  activeWorkspacePaths: Set<string>,
  path: string,
): boolean => activeWorkspacePaths.has(normalizeWorkspaceRootPath(path));

export const createWorkspaceActivationTargets = ({
  workspaceRootPath,
  workspaceRootLabel,
  workspaces,
  workspaceIsolationStacks,
}: CreateWorkspaceActivationTargetsParams): WorkspaceActivationTarget[] => {
  const activeWorkspacePaths = new Set(
    workspaceIsolationStacks.map((stack) =>
      normalizeWorkspaceRootPath(stack.workspaceRootPath),
    ),
  );

  return [
    {
      label: workspaceRootLabel,
      path: workspaceRootPath,
      kind: "base",
      isActive: isActiveWorkspaceTarget(activeWorkspacePaths, workspaceRootPath),
    },
    ...workspaces.map((workspace) => ({
      label: workspace.name,
      path: workspace.workspace,
      kind: "workspace" as const,
      isActive: isActiveWorkspaceTarget(activeWorkspacePaths, workspace.workspace),
    })),
  ];
};

export const getSelectableWorkspaceActivationTargets = (
  activationTargets: WorkspaceActivationTarget[],
): WorkspaceActivationTarget[] =>
  activationTargets.filter((target) => !target.isActive);

export const shouldOfferWorkspaceActivation = (
  isEditing: boolean,
  activationTargets: WorkspaceActivationTarget[],
): boolean =>
  !isEditing && getSelectableWorkspaceActivationTargets(activationTargets).length > 0;

export const getInitialWorkspaceActivationTargetPath = (
  activationTargets: WorkspaceActivationTarget[],
): string | null => getSelectableWorkspaceActivationTargets(activationTargets)[0]?.path ?? null;

export const getWorkspaceActivationTarget = (
  activationTargets: WorkspaceActivationTarget[],
  selectedPath: string | null,
): WorkspaceActivationTarget | null =>
  activationTargets.find((target) => target.path === selectedPath) ?? null;

export const getWorkspaceActivationButtonLabel = (
  selectedLabel: string | null,
): string =>
  selectedLabel
    ? `Activate for ${selectedLabel}`
    : "Activate Project Services";
