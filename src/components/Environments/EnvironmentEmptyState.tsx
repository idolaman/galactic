import { HardDrive, Network, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EnvironmentEmptyStateProps {
  onCreateClick: () => void;
}

export function EnvironmentEmptyState({ onCreateClick }: EnvironmentEmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-8">
      <div className="grid max-w-md gap-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border bg-muted/40 text-primary">
          <Network className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">No environment selected</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Legacy loopback environments are available for older parallel workspace setups. Project Services is recommended for new workflows.
          </p>
        </div>
        <div className="grid gap-2 rounded-md border bg-card p-3 text-left text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Dedicated local IP per environment
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            Bind existing workspaces when compatibility requires it
          </div>
        </div>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Environment
        </Button>
      </div>
    </div>
  );
}
