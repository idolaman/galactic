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

export interface SaveWorkspaceIsolationInput {
  id: string;
  name: string;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  workspaceMode: WorkspaceIsolationMode;
  services: WorkspaceIsolationService[];
}

export interface WorkspaceIsolationMutationResult {
  success: boolean;
  error?: string;
  stack?: WorkspaceIsolationStack;
}

export interface WorkspaceIsolationShellHookStatus {
  enabled: boolean;
  supported: boolean;
  installed: boolean;
  hookPath: string | null;
  zshrcPath: string | null;
  message?: string;
}

export interface WorkspaceIsolationRoute {
  hostname: string;
  port: number;
}
