import { useEffect, useState } from "react";
import { ArrowDownToLine, Loader2, RefreshCw } from "lucide-react";

import { SettingRow } from "@/components/Settings/SettingRow";
import { SettingsSection } from "@/components/Settings/SettingsSection";
import { SettingsStatusBadge } from "@/components/Settings/SettingsStatusBadge";
import { Button } from "@/components/ui/button";
import { useUpdate } from "@/hooks/use-update";

const updateTitleByStatus = {
  available: "Downloading update...",
  checking: "Checking for updates...",
  downloaded: "Ready to install",
  error: "Update check failed",
  idle: "You're up to date",
  "not-available": "No updates available",
  unsupported: "Updates not supported",
} as const;

export function UpdatesSettingSection() {
  const { state, checkForUpdates, installUpdate } = useUpdate();
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    window.electronAPI?.getAppVersion?.().then(setAppVersion);
  }, []);

  const versionLabel = state.version ? `v${state.version}` : undefined;
  const description =
    state.message ??
    (state.status === "downloaded"
      ? "Install the downloaded update and restart Galactic."
      : "Check whether a newer Galactic version is available.");

  return (
    <SettingsSection id="updates" title="Galactic Updates" description="Check for new versions and install updates.">
      <SettingRow
        label={versionLabel ? `${updateTitleByStatus[state.status]} ${versionLabel}` : updateTitleByStatus[state.status]}
        description={description}
      >
        <div className="flex items-center gap-2">
          {appVersion && <SettingsStatusBadge tone="muted">v{appVersion}</SettingsStatusBadge>}
          {state.status === "checking" || state.status === "available" ? (
            <Button variant="outline" size="sm" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
              {state.status === "checking" ? "Checking" : "Downloading"}
            </Button>
          ) : state.status === "downloaded" ? (
            <Button variant="secondary" size="sm" onClick={installUpdate}>
              <ArrowDownToLine className="h-4 w-4" />
              Install
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={checkForUpdates}
              disabled={state.status === "unsupported"}
            >
              <RefreshCw className="h-4 w-4" />
              Check
            </Button>
          )}
        </div>
      </SettingRow>
    </SettingsSection>
  );
}
