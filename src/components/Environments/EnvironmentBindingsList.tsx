import { HardDrive, X } from "lucide-react";

import { SettingsStatusBadge } from "@/components/Settings/SettingsStatusBadge";
import { Button } from "@/components/ui/button";
import { writeCodeWorkspace } from "@/services/workspace";
import { markWorkspaceRequiresRelaunch } from "@/services/workspace-state";
import type { Environment } from "@/types/environment";

interface EnvironmentBindingsListProps {
  environment: Environment;
  unassignTarget: (targetPath: string) => void;
}

export function EnvironmentBindingsList({
  environment,
  unassignTarget,
}: EnvironmentBindingsListProps) {
  const handleUnassign = async (targetPath: string) => {
    unassignTarget(targetPath);
    await writeCodeWorkspace(targetPath, null);
    markWorkspaceRequiresRelaunch(targetPath);
  };

  return (
    <section className="rounded-md border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Workspace Bindings</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Detaching clears generated workspace configuration and requires relaunch.
        </p>
      </div>
      <div className="grid gap-2 p-3">
        {environment.bindings.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-8 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            No bindings attached
          </div>
        ) : (
          environment.bindings.map((binding) => (
            <div
              key={binding.targetPath}
              className="grid gap-2 rounded-md border bg-background px-3 py-2 md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={binding.targetLabel}>
                  {binding.targetLabel}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground" title={binding.targetPath}>
                  {binding.targetPath}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SettingsStatusBadge tone="muted">{binding.projectName}</SettingsStatusBadge>
                <SettingsStatusBadge tone={binding.kind === "base" ? "default" : "muted"}>
                  {binding.kind === "base" ? "Root" : "Workspace"}
                </SettingsStatusBadge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:text-destructive"
                  onClick={() => void handleUnassign(binding.targetPath)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
