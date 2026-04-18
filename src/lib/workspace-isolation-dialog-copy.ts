import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";

const dialogTitles: Record<WorkspaceIsolationDialogStep, string> = {
  1: "Welcome to Project Services",
  2: "Enable Terminal Auto-Env",
  3: "Set Up Project Services",
  4: "Map Service Connections",
  5: "Activate a Workspace",
};

const dialogDescriptions: Record<WorkspaceIsolationDialogStep, string> = {
  1: "See how Galactic gives your project a safer local surface across multiple workspaces.",
  2: "Enable the terminal bridge Galactic needs before configuring routed services.",
  3: "Define services once for the project. You can turn them on per workspace later.",
  4: "Map environment variables to other services in this project or across Galactic.",
  5: "Project Services are saved. Choose one workspace to activate now, or enable others later from their cards.",
};

export const getWorkspaceIsolationDialogTitle = (
  step: WorkspaceIsolationDialogStep,
  isEditing: boolean,
): string => (step === 3 && isEditing ? "Edit Project Services" : dialogTitles[step]);

export const getWorkspaceIsolationDialogDescription = (
  step: WorkspaceIsolationDialogStep,
): string => dialogDescriptions[step];
