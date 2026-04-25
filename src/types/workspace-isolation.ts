export type WorkspaceIsolationMode = "single-app" | "monorepo";

export interface WorkspaceIsolationConnection {
  id: string;
  envKey: string;
  targetStackId: string;
  targetServiceId: string;
}

export interface WorkspaceIsolationService {
  id: string;
  name: string;
  slug: string;
  relativePath: string;
  port: number;
  createdAt: number;
  connections: WorkspaceIsolationConnection[];
}

export interface WorkspaceIsolationStack {
  id: string;
  kind: "workspace-isolation";
  name: string;
  slug: string;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  workspaceMode: WorkspaceIsolationMode;
  createdAt: number;
  services: WorkspaceIsolationService[];
}

export type WorkspaceIsolationProjectTopology = WorkspaceIsolationStack;

export interface WorkspaceIsolationEnabledWorkspace {
  id: string;
  topologyId: string;
  projectId: string;
  projectName: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  createdAt: number;
  servicePorts: Record<string, number>;
}

export type WorkspaceActivationTargetKind = "base" | "workspace";

export interface WorkspaceActivationTarget {
  label: string;
  path: string;
  kind: WorkspaceActivationTargetKind;
  isActive: boolean;
}

export interface WorkspaceIsolationConnectionTarget {
  value: string;
  source: "local" | "external";
  stackId: string;
  serviceId: string;
  projectId: string;
  projectName: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  serviceName: string;
  hostname: string;
  enabled: boolean;
}
