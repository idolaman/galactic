export type ServiceStackWorkspaceMode = "single-app" | "monorepo";

export interface ServiceStackConnection {
  id: string;
  envKey: string;
  targetStackId: string;
  targetServiceId: string;
}

export interface ServiceStackService {
  id: string;
  name: string;
  slug: string;
  relativePath: string;
  port: number;
  createdAt: number;
  connections: ServiceStackConnection[];
}

export interface ServiceStackEnvironment {
  id: string;
  kind: "service-stack";
  name: string;
  slug: string;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  workspaceMode: ServiceStackWorkspaceMode;
  createdAt: number;
  services: ServiceStackService[];
}

export interface ServiceConnectionTarget {
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
}

export interface ResolvedServiceStackConnection extends ServiceStackConnection {
  targetName: string;
  targetProjectName: string;
  targetWorkspaceLabel: string;
  targetUrl: string | null;
  isMissing: boolean;
}
