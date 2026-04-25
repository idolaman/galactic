import { useCallback, useEffect, useState } from "react";
import { WorkspaceIsolationFeatureIntroDialog } from "@/components/settings/WorkspaceIsolationFeatureIntroDialog";
import { WorkspaceIsolationSupportStatusRow } from "@/components/settings/WorkspaceIsolationSupportStatusRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { getWorkspaceIsolationProxySummary } from "@/lib/workspace-isolation-proxy-status";
import {
  getWorkspaceIsolationAutoEnvBadgeLabel,
  getWorkspaceIsolationAutoEnvSummary,
} from "@/lib/workspace-isolation-support";
import {
  trackWorkspaceIsolationAutoEnvEnableAttempted,
  trackWorkspaceIsolationAutoEnvEnableCompleted,
} from "@/services/workspace-isolation-analytics";
import { getWorkspaceIsolationProxyStatus } from "@/services/workspace-isolation";
import type { WorkspaceIsolationProxyStatus } from "@/types/electron";

const defaultProxyStatus: WorkspaceIsolationProxyStatus = { running: false, port: 1355 };
const shellHooksSwitchId = "workspace-isolation-shell-hooks-switch";

export function WorkspaceIsolationShellHooksSettingCard() {
  const { error: showError } = useAppToast();
  const { shellHookStatus, setShellHooksEnabled } = useWorkspaceIsolationManager();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proxyStatus, setProxyStatus] = useState<WorkspaceIsolationProxyStatus>(defaultProxyStatus);

  const loadProxyStatus = useCallback(async () => {
    try {
      setProxyStatus(await getWorkspaceIsolationProxyStatus());
    } catch {
      showError({
        title: "Proxy settings unavailable",
        description: "Unable to load the Project Services proxy status.",
      });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadProxyStatus();
  }, [loadProxyStatus]);

  const handleCheckedChange = async (nextValue: boolean) => {
    if (nextValue) {
      trackWorkspaceIsolationAutoEnvEnableAttempted("settings-card");
    }
    setSaving(true);
    try {
      const result = await setShellHooksEnabled(nextValue);
      if (nextValue) {
        trackWorkspaceIsolationAutoEnvEnableCompleted("settings-card", result.success);
      }
      if (!result.success) {
        showError({
          title: "Setup failed",
          description: result.error ?? "Unable to update the Terminal Auto-Env preference.",
        });
        return;
      }
      await loadProxyStatus();
    } catch (error) {
      if (nextValue) {
        trackWorkspaceIsolationAutoEnvEnableCompleted("settings-card", false);
      }
      showError({
        title: "Setup failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to update the Terminal Auto-Env preference.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card" id="workspace-isolation-shell-hooks">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Project Services Support</CardTitle>
          <WorkspaceIsolationFeatureIntroDialog />
        </div>
        <CardDescription>
          Check the shared proxy and Terminal Auto-Env that Project Services uses. Activation still happens from each workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <WorkspaceIsolationSupportStatusRow
          badgeLabel={proxyStatus.running ? "Running" : "Unavailable"}
          badgeToneClassName={proxyStatus.running ? "h-5 bg-primary/15 text-primary hover:bg-primary/20" : "h-5 bg-muted text-muted-foreground hover:bg-muted"}
          description={getWorkspaceIsolationProxySummary(proxyStatus)}
          title="Local proxy"
          tooltip="The proxy safely routes clean local domains like api.project.local to randomized ports so parallel workspaces do not collide."
        />
        <WorkspaceIsolationSupportStatusRow
          badgeLabel={getWorkspaceIsolationAutoEnvBadgeLabel(shellHookStatus)}
          description={getWorkspaceIsolationAutoEnvSummary(shellHookStatus)}
          labelFor={shellHooksSwitchId}
          title="Terminal Auto-Env"
          tooltip="Adds a managed zsh hook block to ~/.zshrc so your terminal automatically uses the right workspace values."
        >
          <Switch
            id={shellHooksSwitchId}
            checked={shellHookStatus?.enabled ?? false}
            disabled={loading || saving || !shellHookStatus?.supported}
            onCheckedChange={handleCheckedChange}
          />
        </WorkspaceIsolationSupportStatusRow>
      </CardContent>
    </Card>
  );
}
