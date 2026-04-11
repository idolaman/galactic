import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppToast } from "@/hooks/use-app-toast";
import {
  getWorkspaceIsolationShellHookStatus,
  setWorkspaceIsolationShellHooksEnabled,
} from "@/services/workspace-isolation";
import type { WorkspaceIsolationShellHookStatus } from "@/types/electron";

const defaultStatus: WorkspaceIsolationShellHookStatus = {
  enabled: false,
  supported: false,
  installed: false,
  hookPath: null,
  zshrcPath: null,
};

export function WorkspaceIsolationShellHooksSettingCard() {
  const { error: showError } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<WorkspaceIsolationShellHookStatus>(defaultStatus);

  useEffect(() => {
    void getWorkspaceIsolationShellHookStatus()
      .then(setStatus)
      .catch(() => {
        showError({
          title: "Shell hook setting unavailable",
          description: "Unable to load the Workspace Isolation shell hook preference.",
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
      setStatus(await getWorkspaceIsolationShellHookStatus());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card" id="workspace-isolation-shell-hooks">
      <CardHeader className="pb-4">
        <CardTitle>Workspace Isolation Shell Hooks</CardTitle>
        <CardDescription>Export HOST, PORT, and connected service URLs from your current zsh directory.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
      </CardContent>
    </Card>
  );
}
