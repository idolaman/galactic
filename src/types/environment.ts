export type EnvironmentTargetKind = "base" | "workspace";

export interface EnvironmentBinding {
  projectId: string;
  projectName: string;
  targetPath: string;
  targetLabel: string;
  kind: EnvironmentTargetKind;
}

export interface Environment {
  id: string;
  name: string;
  address: string;
  createdAt: number;
  bindings: EnvironmentBinding[];
  envVars?: Record<string, string>;
}
