import { Route, Server, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getWorkspaceIsolationRouteDomain,
  getWorkspaceIsolationServicePathLabel,
} from "@/lib/workspace-isolation";
import type { WorkspaceIsolationService } from "@/types/workspace-isolation";

interface WorkspaceIsolationDialogServiceOverviewProps {
  issue?: string;
  projectName: string;
  service: WorkspaceIsolationService;
  workspaceLabel: string;
}

export const WorkspaceIsolationDialogServiceOverview = ({
  issue,
  projectName,
  service,
  workspaceLabel,
}: WorkspaceIsolationDialogServiceOverviewProps) => {
  const stackPreview = { projectName, workspaceRootLabel: workspaceLabel };
  const folderLabel = service.relativePath
    ? getWorkspaceIsolationServicePathLabel(service)
    : "Set a folder";
  const routeDomain = getWorkspaceIsolationRouteDomain(stackPreview, service);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 text-xs md:grid-cols-3">
        <div className="min-w-0 rounded-md border bg-background/70 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Workflow className="h-3.5 w-3.5" />
            <span>Folder</span>
          </div>
          <p className="truncate font-mono text-foreground">{folderLabel}</p>
        </div>
        <div className="min-w-0 rounded-md border bg-background/70 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Route className="h-3.5 w-3.5" />
            <span>Route</span>
          </div>
          <p className="truncate font-mono text-foreground">{routeDomain}</p>
        </div>
        <div className="min-w-0 rounded-md border bg-background/70 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Server className="h-3.5 w-3.5" />
            <span>Target</span>
          </div>
          <p className="truncate font-mono text-foreground">
            localhost:{service.port}
          </p>
        </div>
      </div>
      {issue ? <p className="text-xs text-destructive">{issue}</p> : null}
      <details className="group rounded-md border bg-muted/20 px-3 py-2 text-xs">
        <summary className="cursor-pointer text-muted-foreground">
          Generated details
        </summary>
        <div className="mt-2 grid gap-1 text-muted-foreground">
          <p>
            Proxy route forwards to the local port shown above for each active
            workspace.
          </p>
          <p>
            Terminal Auto-Env exposes connected service URLs as generated
            environment variables.
          </p>
          <Badge variant="outline" className="w-fit">
            Project Services
          </Badge>
        </div>
      </details>
    </div>
  );
};
