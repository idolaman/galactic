import { Network, Pencil, Trash2 } from "lucide-react";

import { EnvironmentBindingsList } from "@/components/Environments/EnvironmentBindingsList";
import { EnvironmentVariablesEditor } from "@/components/Environments/EnvironmentVariablesEditor";
import { SettingsStatusBadge } from "@/components/Settings/SettingsStatusBadge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Environment } from "@/types/environment";

interface EnvironmentDetailPanelProps {
  environment: Environment;
  onDelete: (environment: Environment) => void;
  onRename: () => void;
  unassignTarget: (targetPath: string) => void;
  updateEnvironment: (
    id: string,
    updates: { envVars?: Record<string, string>; name?: string },
  ) => Promise<{ success: boolean; error?: string }>;
}

export function EnvironmentDetailPanel({
  environment,
  onDelete,
  onRename,
  unassignTarget,
  updateEnvironment,
}: EnvironmentDetailPanelProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h2 className="truncate text-lg font-semibold">{environment.name}</h2>
            <SettingsStatusBadge tone="muted">{environment.bindings.length} bindings</SettingsStatusBadge>
          </div>
          <code className="inline-flex rounded border bg-muted px-2 py-1 font-mono text-xs">
            {environment.address}
          </code>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRename}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => onDelete(environment)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="grid max-w-5xl gap-4 p-6">
          <EnvironmentVariablesEditor
            environment={environment}
            updateEnvironment={updateEnvironment}
          />
          <EnvironmentBindingsList
            environment={environment}
            unassignTarget={unassignTarget}
          />
        </div>
      </ScrollArea>
    </main>
  );
}
