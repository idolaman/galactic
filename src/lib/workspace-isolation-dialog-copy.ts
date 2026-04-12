import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";

const dialogTitles: Record<WorkspaceIsolationDialogStep, string> = {
  1: "Welcome to Workspace Isolation",
  2: "Enable Terminal Auto-Env",
  3: "Isolate Workspace",
  4: "Map Connections",
};

const dialogDescriptions: Record<WorkspaceIsolationDialogStep, string> = {
  1: "See how Galactic gives each workspace its own routed local surface.",
  2: "Enable the terminal bridge Galactic needs before configuring routed services.",
  3: "Configure the services Galactic will route into this workspace.",
  4: "Map environment variables to other services in this workspace or across Galactic projects.",
};

export const getWorkspaceIsolationDialogTitle = (
  step: WorkspaceIsolationDialogStep,
  isEditing: boolean,
): string => (step === 3 && isEditing ? "Edit Workspace Isolation" : dialogTitles[step]);

export const getWorkspaceIsolationDialogDescription = (
  step: WorkspaceIsolationDialogStep,
): string => dialogDescriptions[step];
