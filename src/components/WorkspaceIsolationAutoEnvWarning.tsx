import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceIsolationAutoEnvWarningProps {
  disabled: boolean;
  onEnable: () => void;
}

export function WorkspaceIsolationAutoEnvWarning({
  disabled,
  onEnable,
}: WorkspaceIsolationAutoEnvWarningProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">Auto-Env is not enabled</p>
        </div>
        <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
          Commands like &apos;npm run dev&apos; won&apos;t automatically use the
          correct local domains.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-amber-500/30 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
        onClick={onEnable}
        disabled={disabled}
      >
        Set up Auto-Env
      </Button>
    </div>
  );
}
