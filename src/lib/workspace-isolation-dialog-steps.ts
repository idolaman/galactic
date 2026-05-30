import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";

export interface WorkspaceIsolationDialogStepItem {
  id: string;
  label: string;
}

const fullSetupSteps: WorkspaceIsolationDialogStepItem[] = [
  { id: "1", label: "Intro" },
  { id: "2", label: "Terminal" },
  { id: "3", label: "Services" },
  { id: "4", label: "Connections" },
  { id: "5", label: "Activate" },
];

const configurationSteps: WorkspaceIsolationDialogStepItem[] = [
  { id: "3", label: "Services" },
  { id: "4", label: "Connections" },
  { id: "5", label: "Activate" },
];

export const getWorkspaceIsolationDialogSteps = (
  _step: WorkspaceIsolationDialogStep,
  useFullSetupSteps: boolean,
): WorkspaceIsolationDialogStepItem[] =>
  useFullSetupSteps ? fullSetupSteps : configurationSteps;

export const getWorkspaceIsolationDialogStepId = (
  step: WorkspaceIsolationDialogStep,
): string => String(step);
