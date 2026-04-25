import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EnvironmentSelector } from "@/components/EnvironmentSelector";
import { getLegacyLocalEnvironmentSummary } from "@/lib/workspace-networking";
import {
  trackWorkspaceIsolationLegacyBridgeOpened,
  trackWorkspaceIsolationLegacyBridgeSelected,
} from "@/services/workspace-isolation-support-analytics";
import { cn } from "@/lib/utils";
import type { Environment } from "@/types/environment";
import type { WorkspaceActivationTargetKind } from "@/types/workspace-isolation";

interface WorkspaceLegacyEnvironmentCardProps {
  environments: Environment[];
  localEnvironmentId: string | null;
  targetKind: WorkspaceActivationTargetKind;
  workspaceLabel: string;
  onLocalEnvironmentChange: (environmentId: string | null) => void;
}

export const WorkspaceLegacyEnvironmentCard = ({
  environments,
  localEnvironmentId,
  targetKind,
  workspaceLabel,
  onLocalEnvironmentChange,
}: WorkspaceLegacyEnvironmentCardProps) => {
  const [open, setOpen] = useState(false);
  const previousOpenRef = useRef(false);
  const selectedEnvironmentName = environments.find(
    (environment) => environment.id === localEnvironmentId,
  )?.name ?? null;
  const summary = getLegacyLocalEnvironmentSummary(selectedEnvironmentName);

  useEffect(() => {
    if (open && !previousOpenRef.current) {
      trackWorkspaceIsolationLegacyBridgeOpened({ targetKind });
    }
    previousOpenRef.current = open;
  }, [open, targetKind]);

  const handleLocalEnvironmentChange = (environmentId: string | null) => {
    trackWorkspaceIsolationLegacyBridgeSelected({
      targetKind,
      hasEnvironment: Boolean(environmentId),
    });
    onLocalEnvironmentChange(environmentId);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/10 transition-colors hover:border-border/60">
        <div className="p-2.5">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start p-1 hover:bg-transparent"
            >
              <div className="flex w-full items-center justify-between gap-3 text-left">
                <div className="flex w-full min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Older compatibility mode</span>
                    <Badge
                      variant="outline"
                      className="h-[18px] px-1.5 text-[9px] uppercase tracking-wider text-muted-foreground opacity-70"
                    >
                      Deprecated
                    </Badge>
                  </div>
                  {!open && summary ? (
                    <p className="truncate text-[11px] text-muted-foreground/70">
                      {summary}
                    </p>
                  ) : null}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </div>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="space-y-3 border-t border-border/40 bg-background/40 p-3 pt-2">
            <div className="space-y-1 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-foreground">Local IP Environment</span>
                <Badge
                  variant="outline"
                  className="h-[18px] px-1.5 text-[9px] uppercase tracking-wider text-muted-foreground opacity-70"
                >
                  Deprecated
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                Project Services is the recommended path for new parallel workspace setups. Keep this older local-IP mode only for existing compatibility needs.
              </p>
            </div>
            <EnvironmentSelector
              environments={environments}
              value={localEnvironmentId}
              targetLabel={workspaceLabel}
              minimal
              onChange={handleLocalEnvironmentChange}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
