import { ArrowDownToLine, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UpdateSettingsCardProps {
  appVersion: string | null;
  checkForUpdates: () => void;
  installUpdate: () => void;
  updateState: {
    status: "idle" | "checking" | "available" | "downloaded" | "not-available" | "error" | "unsupported";
    version?: string;
    message?: string;
  };
}

const statusLabel: Record<UpdateSettingsCardProps["updateState"]["status"], string> = {
  idle: "You're up to date",
  checking: "Checking for updates...",
  available: "Downloading update...",
  downloaded: "Ready to install",
  "not-available": "No updates available",
  error: "Update check failed",
  unsupported: "Updates not supported",
};

export function UpdateSettingsCard({ appVersion, checkForUpdates, installUpdate, updateState }: UpdateSettingsCardProps) {
  const label = updateState.version && ["available", "downloaded"].includes(updateState.status)
    ? `${statusLabel[updateState.status]} v${updateState.version}`
    : statusLabel[updateState.status];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Galactic Updates</CardTitle>
            <CardDescription>Check for new Galactic releases and install them.</CardDescription>
          </div>
          {appVersion ? <Badge variant="outline">v{appVersion}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{updateState.message ?? "Galactic handles update checks from the main process."}</p>
        </div>
        {updateState.status === "downloaded" ? (
          <Button onClick={installUpdate} className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Install update
          </Button>
        ) : (
          <Button variant="outline" onClick={checkForUpdates} disabled={updateState.status === "checking" || updateState.status === "available"} className="gap-2">
            {updateState.status === "checking" || updateState.status === "available" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Check now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
