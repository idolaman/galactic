import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";

export type CreateWorkspaceStep = "branch" | "base";

export interface UseCreateWorkspaceDialogOptions {
  projectPath: string;
  isCreatingWorkspace: boolean;
  onCreateWorkspace: (request: CreateWorkspaceRequest) => Promise<boolean>;
  onLoadBranches?: () => void | Promise<void>;
}
