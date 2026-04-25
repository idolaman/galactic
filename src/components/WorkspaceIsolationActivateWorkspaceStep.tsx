import { ShieldCheck, TerminalSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getWorkspaceIsolationProxySummary } from "@/lib/workspace-isolation-proxy-status";
import {
  getWorkspaceIsolationAutoEnvBadgeLabel,
  getWorkspaceIsolationAutoEnvSummary,
} from "@/lib/workspace-isolation-support";
import { cn } from "@/lib/utils";
import type { WorkspaceIsolationProxyStatus, WorkspaceIsolationShellHookStatus } from "@/types/electron";
import type { WorkspaceActivationTarget } from "@/types/workspace-isolation";

interface WorkspaceIsolationActivateWorkspaceStepProps {
  activationTargets: WorkspaceActivationTarget[];
  selectedTargetPath: string | null;
  proxyStatus: WorkspaceIsolationProxyStatus;
  shellHookStatus: WorkspaceIsolationShellHookStatus | null;
  onSelectTarget: (path: string) => void;
}

const targetKindLabels = {
  base: "Repository Root",
  workspace: "Workspace",
} as const;

export const WorkspaceIsolationActivateWorkspaceStep = ({
  activationTargets,
  selectedTargetPath,
  proxyStatus,
  shellHookStatus,
  onSelectTarget,
}: WorkspaceIsolationActivateWorkspaceStepProps) => (
  <div className="flex flex-1 min-w-0 flex-col gap-6">
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1 rounded-lg border bg-background/70 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Local proxy</span>
          <Badge variant="secondary">{proxyStatus.running ? "Running" : "Unavailable"}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {getWorkspaceIsolationProxySummary(proxyStatus)}
        </p>
      </div>
      <div className="space-y-1 rounded-lg border bg-background/70 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <TerminalSquare className="h-4 w-4 text-primary" />
          <span>Terminal Auto-Env</span>
          <Badge variant="secondary">
            {getWorkspaceIsolationAutoEnvBadgeLabel(shellHookStatus)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {getWorkspaceIsolationAutoEnvSummary(shellHookStatus)}
        </p>
      </div>
    </div>

    <p className="text-xs text-muted-foreground">
      Choose where to turn Project Services on first.
    </p>

    <RadioGroup
      value={selectedTargetPath ?? undefined}
      onValueChange={onSelectTarget}
      className="grid min-w-0 gap-3"
    >
      {activationTargets.map((target) => {
        const isSelected = target.path === selectedTargetPath;
        const targetId = `activation-target-${encodeURIComponent(target.path)}`;

        return (
          <Label
            key={target.path}
            htmlFor={targetId}
            className={cn(
              "flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-xl border bg-background/70 p-4 transition-colors",
              isSelected && "border-primary/60 bg-primary/5",
            )}
          >
            <div className="flex flex-1 min-w-0 flex-col space-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{target.label}</span>
                <Badge variant="outline" className="shrink-0">{targetKindLabels[target.kind]}</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                Activate Project Services for {target.label} now.
              </p>
            </div>
            <RadioGroupItem
              value={target.path}
              id={targetId}
              className="shrink-0"
            />
          </Label>
        );
      })}
    </RadioGroup>
  </div>
);
