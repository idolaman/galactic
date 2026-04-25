import type { WorkspaceIsolationProxyStatus } from "../types/electron.js";

export const getWorkspaceIsolationProxySummary = (
  status: WorkspaceIsolationProxyStatus,
): string =>
  status.running
    ? `Proxy running on localhost:${status.port}. Routed workspace domains resolve through Galactic here.`
    : status.message ??
      "Proxy unavailable. Restart Galactic to restore routed workspace domains.";
