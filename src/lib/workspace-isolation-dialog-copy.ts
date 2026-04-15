import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";

const dialogTitles: Record<WorkspaceIsolationDialogStep, string> = {
  1: "Welcome to Project Isolation",
  2: "Enable Terminal Auto-Env",
  3: "Project Services Topology",
  4: "Map Connections",
};

const dialogDescriptions: Record<WorkspaceIsolationDialogStep, string> = {
  1: "See how Galactic gives your project its own routed local surface.",
  2: "Enable the terminal bridge Galactic needs before configuring routed services.",
  3: "Define the core services for this project. They will be available to all branches.",
  4: "Map environment variables to other services in this project or across Galactic.",
};

export const getWorkspaceIsolationDialogTitle = (
  step: WorkspaceIsolationDialogStep,
  isEditing: boolean,
): string => (step === 3 && isEditing ? "Edit Project Topology" : dialogTitles[step]);

export const getWorkspaceIsolationDialogDescription = (
  step: WorkspaceIsolationDialogStep,
): string => dialogDescriptions[step];
