import { GitBranch, Network, ShieldCheck } from "lucide-react";
import {
  getWorkspaceIsolationSupportCopy,
  WORKSPACE_ISOLATION_SHELL_SUPPORT_COPY,
} from "@/lib/workspace-isolation-intro";

const introItems = [
  {
    icon: GitBranch,
    title: "Run multiple branches side by side",
    description:
      "Workspace Isolation lets you keep separate branch environments live at the same time without localhost collisions.",
  },
  {
    icon: Network,
    title: "Route each service to a stable local domain",
    description:
      "Galactic gives every service a clean local hostname so you can use predictable URLs instead of remembering internal ports.",
  },
  {
    icon: ShieldCheck,
    title: "Keep environments safer to switch between",
    description:
      "Each workspace gets its own routed surface, so opening a second branch does not overwrite the services already running in another one.",
  },
] as const;

export const WorkspaceIsolationIntroStep = () => (
  <div className="flex flex-1 flex-col justify-center gap-6 py-4">
    <div className="space-y-4">
      {introItems.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex gap-4">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-md border border-border/60 bg-muted/30 p-3">
      <p className="text-sm font-medium">Supported today</p>
      <p className="text-xs text-muted-foreground">
        {getWorkspaceIsolationSupportCopy()}
      </p>
      <p className="text-xs text-muted-foreground">
        {WORKSPACE_ISOLATION_SHELL_SUPPORT_COPY}
      </p>
    </div>
  </div>
);
