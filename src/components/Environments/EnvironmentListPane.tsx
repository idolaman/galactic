import { Network, Plus } from "lucide-react";

import { SettingsStatusBadge } from "@/components/Settings/SettingsStatusBadge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Environment } from "@/types/environment";

interface EnvironmentListPaneProps {
  environments: Environment[];
  onCreateClick: () => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function EnvironmentListPane({
  environments,
  onCreateClick,
  onSelect,
  selectedId,
}: EnvironmentListPaneProps) {
  return (
    <aside className="flex min-h-0 flex-col border-r bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold">Environments</h1>
          <p className="text-xs text-muted-foreground">Legacy loopback configuration</p>
        </div>
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-1 p-2">
          {environments.length === 0 && (
            <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No environments yet
            </div>
          )}
          {environments.map((environment) => (
            <button
              key={environment.id}
              type="button"
              onClick={() => onSelect(environment.id)}
              className={cn(
                "flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors",
                selectedId === environment.id
                  ? "border-primary/40 bg-primary/10"
                  : "hover:bg-muted/60",
              )}
            >
              <Network className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{environment.name}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">
                  {environment.address}
                </span>
              </span>
              <SettingsStatusBadge tone="muted">{environment.bindings.length}</SettingsStatusBadge>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
