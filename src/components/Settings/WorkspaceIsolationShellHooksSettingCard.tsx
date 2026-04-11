import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { getWorkspaceIsolationProxyStatus } from "@/services/workspace-isolation";
import type { WorkspaceIsolationProxyStatus } from "@/types/electron";
import { getWorkspaceIsolationProxySummary } from "@/lib/workspace-isolation-proxy-status";

const defaultProxyStatus: WorkspaceIsolationProxyStatus = {
  running: false,
  port: 1355,
};

export function WorkspaceIsolationShellHooksSettingCard() {
  const { error: showError } = useAppToast();
  const { shellHookStatus, setShellHooksEnabled } = useWorkspaceIsolationManager();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proxyStatus, setProxyStatus] =
    useState<WorkspaceIsolationProxyStatus>(defaultProxyStatus);

  useEffect(() => {
    getWorkspaceIsolationProxyStatus()
      .then(setProxyStatus)
      .catch(() => {
        showError({
          title: "Proxy settings unavailable",
          description: "Unable to load the Workspace Isolation proxy status.",
        });
      })
      .finally(() => setLoading(false));
  }, [showError]);

  const handleCheckedChange = async (nextValue: boolean) => {
    setSaving(true);
    try {
      const result = await setShellHooksEnabled(nextValue);
      if (!result.success) {
        showError({
          title: "Setup failed",
          description: result.error ?? "Unable to update the Terminal Auto-Env preference.",
        });
      }
      const nextProxyStatus = await getWorkspaceIsolationProxyStatus();
      setProxyStatus(nextProxyStatus);
    } finally {
      setSaving(false);
    }
  };

  const isSupported = shellHookStatus?.supported ?? false;
  const isEnabled = shellHookStatus?.enabled ?? false;
  const message = shellHookStatus?.message ?? "Install a managed zsh hook block in ~/.zshrc.";

  return (
    <Card className="border-border bg-card" id="workspace-isolation-shell-hooks">
      <CardHeader className="pb-4">
        <CardTitle>Workspace Isolation</CardTitle>
        <CardDescription>
          Run multiple branches of your stack safely using clean local domains, powered by a shared proxy and Terminal Auto-Env.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <TooltipProvider>
          <div className="flex flex-col gap-3 rounded-lg border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Local proxy</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" size="icon" variant="ghost" className="h-4 w-4 rounded-full text-muted-foreground hover:text-primary">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px]">
                    The proxy safely routes clean local domains (like api.project.local) to randomized ports to avoid localhost collisions.
                  </TooltipContent>
                </Tooltip>
                <Badge
                  variant="secondary"
                  className={proxyStatus.running
                    ? "h-5 bg-primary/15 text-primary hover:bg-primary/20"
                    : "h-5 bg-muted text-muted-foreground hover:bg-muted"}
                >
                  {proxyStatus.running ? "Running" : "Unavailable"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {getWorkspaceIsolationProxySummary(proxyStatus)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="workspace-isolation-shell-hooks" className="text-sm font-medium">Terminal Auto-Env (direnv support)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" size="icon" variant="ghost" className="h-4 w-4 rounded-full text-muted-foreground hover:text-primary">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px]">
                    Adds a secure hook to your ~/.zshrc so your terminal automatically knows which randomized port to use without manual config.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
            <Switch
              id="workspace-isolation-shell-hooks"
              checked={isEnabled}
              disabled={loading || saving || !isSupported}
              onCheckedChange={handleCheckedChange}
            />
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
