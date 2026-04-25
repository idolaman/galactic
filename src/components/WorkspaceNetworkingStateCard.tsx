import type { LucideIcon } from "lucide-react";
import { AlertTriangle, PlayCircle, ShieldCheck, StopCircle, Waypoints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getWorkspaceIsolationReasonLabel,
  getWorkspaceIsolationStateDescription,
  getWorkspaceIsolationStateTitle,
} from "@/lib/workspace-isolation-status-copy";
import type {
  WorkspaceIsolationWorkspaceStatus,
} from "@/lib/workspace-isolation-status";
import {
  cn,
} from "@/lib/utils";

interface WorkspaceNetworkingStateCardProps {
  disabled: boolean;
  isWorkspaceActive: boolean;
  onPrimaryAction: () => void;
  status: WorkspaceIsolationWorkspaceStatus;
  isSupportActionDisabled?: boolean;
  onEnableAutoEnv?: () => void;
  onOpenProof?: () => void;
  onRefreshSupport?: () => void;
}

const getActionCopy = (
  status: WorkspaceIsolationWorkspaceStatus,
): string | null => {
  if (status.reason === "proxy_unavailable") {
    return "Refresh support";
  }

  if (status.reason === "auto_env_off") {
    return "Set up Auto-Env";
  }

  if (status.reason === "connected_target_not_live") {
    return "Open proof";
  }

  return null;
};

const iconByState: Record<WorkspaceIsolationWorkspaceStatus["state"], LucideIcon> = {
  ready_to_activate: Waypoints,
  active: ShieldCheck,
  needs_attention: AlertTriangle,
  blocked: AlertTriangle,
};

const cardClassNames: Record<WorkspaceIsolationWorkspaceStatus["state"], string> = {
  ready_to_activate: "border-primary/20 bg-primary/5",
  active: "border-primary/30 bg-primary/5",
  needs_attention: "border-amber-500/30 bg-amber-500/10",
  blocked: "border-destructive/30 bg-destructive/10",
};

const iconClassNames: Record<WorkspaceIsolationWorkspaceStatus["state"], string> = {
  ready_to_activate: "bg-primary/10 text-primary",
  active: "bg-primary/15 text-primary",
  needs_attention: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  blocked: "bg-destructive/15 text-destructive",
};

export const WorkspaceNetworkingStateCard = ({
  disabled,
  isWorkspaceActive,
  onPrimaryAction,
  status,
  isSupportActionDisabled,
  onEnableAutoEnv,
  onOpenProof,
  onRefreshSupport,
}: WorkspaceNetworkingStateCardProps) => {
  const Icon = iconByState[status.state];
  const reasonLabel = getWorkspaceIsolationReasonLabel(status.reason);

  const supportActionLabel = getActionCopy(status);
  const onSupportAction =
    status.reason === "proxy_unavailable"
      ? onRefreshSupport
      : status.reason === "auto_env_off"
        ? onEnableAutoEnv
        : status.reason === "connected_target_not_live"
          ? onOpenProof
          : null;

  return (
    <div className={cn("overflow-hidden rounded-xl border shadow-sm", cardClassNames[status.state])}>
      <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 min-w-0 items-start gap-3">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", iconClassNames[status.state])}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-sm font-semibold tracking-tight">
                {getWorkspaceIsolationStateTitle(status.state)}
              </p>
              {reasonLabel ? (
                <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[9px]">
                  {reasonLabel}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground text-balance">
              {getWorkspaceIsolationStateDescription(status)}
            </p>
            {supportActionLabel && onSupportAction ? (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSupportAction}
                  disabled={isSupportActionDisabled}
                  className={cn(
                    "h-7 shrink-0 px-3 text-xs bg-background/50",
                    status.state === "needs_attention" && "border-amber-500/20 hover:bg-amber-500/10 text-amber-900 dark:text-amber-100",
                    status.state === "blocked" && "border-destructive/20 hover:bg-destructive/10 text-destructive-foreground dark:text-destructive",
                  )}
                >
                  {supportActionLabel}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 flex items-center">
          <Button
            size="sm"
            variant={isWorkspaceActive ? "ghost" : "outline"}
            onClick={onPrimaryAction}
            disabled={disabled}
            className={cn(
              "h-8 px-3 text-xs",
              isWorkspaceActive && "text-destructive hover:bg-destructive/10",
            )}
          >
            {isWorkspaceActive ? (
              <StopCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <PlayCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            )}
            {isWorkspaceActive ? "Stop" : "Activate"}
          </Button>
        </div>
      </div>
    </div>
  );
};
