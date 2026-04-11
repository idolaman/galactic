import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppToast } from "@/hooks/use-app-toast";
import {
  getWorkspaceIsolationProxyStatus,
  getWorkspaceIsolationShellHookStatus,
  setWorkspaceIsolationShellHooksEnabled,
} from "@/services/workspace-isolation";
import type {
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationShellHookStatus,
} from "@/types/electron";
import { getWorkspaceIsolationProxySummary } from "@/lib/workspace-isolation-proxy-status";

const defaultStatus: WorkspaceIsolationShellHookStatus = {
  enabled: false,
  supported: false,
  installed: false,
  hookPath: null,
  zshrcPath: null,
};
const defaultProxyStatus: WorkspaceIsolationProxyStatus = {
  running: false,
  port: 1355,
};

export function WorkspaceIsolationShellHooksSettingCard() {
  const { error: showError } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<WorkspaceIsolationShellHookStatus>(defaultStatus);
  const [proxyStatus, setProxyStatus] =
    useState<WorkspaceIsolationProxyStatus>(defaultProxyStatus);

  useEffect(() => {
    void Promise.all([
      getWorkspaceIsolationShellHookStatus(),
      getWorkspaceIsolationProxyStatus(),
    ])
      .then(([nextStatus, nextProxyStatus]) => {
        setStatus(nextStatus);
        setProxyStatus(nextProxyStatus);
      })
      .catch(() => {
        showError({
          title: "Workspace Isolation settings unavailable",
          description: "Unable to load the Workspace Isolation runtime settings.",
        });
      })
      .finally(() => setLoading(false));
  }, [showError]);

  const handleCheckedChange = async (nextValue: boolean) => {
    setSaving(true);
    try {
      const result = await setWorkspaceIsolationShellHooksEnabled(nextValue);
      if (!result.success) {
        showError({
          title: "Shell hook update failed",
          description: result.error ?? "Unable to update the Workspace Isolation shell hook preference.",
        });
      }
      const [nextStatus, nextProxyStatus] = await Promise.all([
        getWorkspaceIsolationShellHookStatus(),
        getWorkspaceIsolationProxyStatus(),
      ]);
      setStatus(nextStatus);
      setProxyStatus(nextProxyStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card" id="workspace-isolation-shell-hooks">
      <CardHeader className="pb-4">
        <CardTitle>Workspace Isolation</CardTitle>
        <CardDescription>
          Galactic routes local domains through a shared localhost proxy and can export HOST, PORT, and connected service URLs from zsh.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-3 rounded-lg border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Local proxy</Label>
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
            <Label htmlFor="workspace-isolation-shell-hooks" className="text-sm font-medium">zsh hook installation</Label>
            <p className="text-xs text-muted-foreground">{status.message ?? "Install a managed zsh hook block in ~/.zshrc."}</p>
          </div>
          <Switch
            id="workspace-isolation-shell-hooks"
            checked={status.enabled}
            disabled={loading || saving || !status.supported}
            onCheckedChange={handleCheckedChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
