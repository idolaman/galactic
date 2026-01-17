import { RefreshCw } from "lucide-react";
import { useEnvironmentManager } from "@/hooks/use-environment-manager";
import { useWorkspaceNeedsRelaunch } from "@/hooks/use-workspace-relaunch";
import { cn } from "@/lib/utils";

interface WorkspaceRelaunchIndicatorProps {
  path: string;
  showLabel?: boolean;
  className?: string;
}

export const WorkspaceRelaunchIndicator = ({
  path,
  showLabel = false,
  className,
}: WorkspaceRelaunchIndicatorProps) => {
  const { environmentForTarget } = useEnvironmentManager();
  const environmentId = environmentForTarget(path)?.id ?? null;
  const needsRelaunch = useWorkspaceNeedsRelaunch(path, environmentId);

  if (!needsRelaunch) {
    return null;
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-orange-500", className)}>
      <RefreshCw className="h-3.5 w-3.5" />
      {showLabel && <span>Relaunch</span>}
    </span>
  );
};
