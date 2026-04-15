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

export interface SaveWorkspaceIsolationInput {
  name: string;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  workspaceMode: WorkspaceIsolationMode;
  services: WorkspaceIsolationService[];
}

export interface EnableWorkspaceIsolationInput {
  projectId: string;
  projectName: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
}

export interface WorkspaceIsolationMutationResult {
  success: boolean;
  error?: string;
  stack?: WorkspaceIsolationStack;
}

export interface WorkspaceIsolationTopologyMutationResult {
  success: boolean;
  error?: string;
  topology?: WorkspaceIsolationProjectTopology;
}

export interface WorkspaceIsolationShellHookStatus {
  enabled: boolean;
  supported: boolean;
  installed: boolean;
  hookPath: string | null;
  zshrcPath: string | null;
  message?: string;
}

export interface WorkspaceIsolationProxyStatus {
  running: boolean;
  port: number;
  message?: string;
}

export interface WorkspaceIsolationRoute {
  hostname: string;
  port: number;
}
