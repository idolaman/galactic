import { useEffect, useState, type ReactNode } from "react";
import {
  WorkspaceIsolationManagerContext,
  type SaveWorkspaceIsolationInput,
  type WorkspaceIsolationManagerValue,
} from "@/hooks/workspace-isolation-manager-context";
import { normalizeWorkspaceRootPath } from "@/lib/workspace-isolation-helpers";
import {
  deleteWorkspaceIsolationStack,
  getInitialWorkspaceIsolationStacks,
  getWorkspaceIsolationStacks,
  saveWorkspaceIsolationStack,
} from "@/services/workspace-isolation";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

export const WorkspaceIsolationManagerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [workspaceIsolationStacks, setWorkspaceIsolationStacks] =
    useState<WorkspaceIsolationStack[]>(getInitialWorkspaceIsolationStacks);

  useEffect(() => {
    void getWorkspaceIsolationStacks().then(setWorkspaceIsolationStacks);
  }, []);

  const workspaceIsolationForWorkspace = (workspaceRootPath: string) => {
    const normalizedPath = normalizeWorkspaceRootPath(workspaceRootPath);
    return (
      workspaceIsolationStacks.find(
        (stack) => stack.workspaceRootPath === normalizedPath,
      ) ?? null
    );
  };

  const handleSaveWorkspaceIsolationStack = async (
    input: SaveWorkspaceIsolationInput,
  ) => {
    const result = await saveWorkspaceIsolationStack(input);
    if (!result.success || !result.stack) {
      return result;
    }
    const normalizedWorkspaceRootPath = normalizeWorkspaceRootPath(input.workspaceRootPath);
    setWorkspaceIsolationStacks((currentStacks) => [
      result.stack!,
      ...currentStacks.filter(
        (stack) =>
          stack.id !== result.stack!.id &&
          stack.workspaceRootPath !== normalizedWorkspaceRootPath,
      ),
    ]);
    return result;
  };

  const handleDeleteWorkspaceIsolationStack = async (stackId: string) => {
    const result = await deleteWorkspaceIsolationStack(stackId);
    if (result.success) {
      setWorkspaceIsolationStacks((currentStacks) =>
        currentStacks.filter((stack) => stack.id !== stackId),
      );
    }
    return result;
  };

  const deleteWorkspaceIsolationForWorkspace = async (
    workspaceRootPath: string,
  ) => {
    const stack = workspaceIsolationForWorkspace(workspaceRootPath);
    if (!stack) {
      return;
    }
    await handleDeleteWorkspaceIsolationStack(stack.id);
  };

  const value: WorkspaceIsolationManagerValue = {
    workspaceIsolationStacks,
    workspaceIsolationForWorkspace,
    saveWorkspaceIsolationStack: handleSaveWorkspaceIsolationStack,
    deleteWorkspaceIsolationStack: handleDeleteWorkspaceIsolationStack,
    deleteWorkspaceIsolationForWorkspace,
  };

  return (
    <WorkspaceIsolationManagerContext.Provider value={value}>
      {children}
    </WorkspaceIsolationManagerContext.Provider>
  );
};
