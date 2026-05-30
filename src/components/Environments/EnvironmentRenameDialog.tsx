import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppToast } from "@/hooks/use-app-toast";
import type { Environment } from "@/types/environment";

interface EnvironmentRenameDialogProps {
  environment: Environment | null;
  environments: Environment[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  updateEnvironment: (id: string, updates: { name?: string }) => Promise<{ success: boolean; error?: string }>;
}

export function EnvironmentRenameDialog({
  environment,
  environments,
  onOpenChange,
  open,
  updateEnvironment,
}: EnvironmentRenameDialogProps) {
  const { error } = useAppToast();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open && environment) {
      setName(environment.name);
    }
  }, [environment, open]);

  const handleRename = async () => {
    if (!environment) return;
    const trimmed = name.trim();
    if (!trimmed) {
      error({ title: "Name required", description: "Environment name cannot be empty." });
      return;
    }

    const nameTaken = environments.some(
      (env) => env.id !== environment.id && env.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (nameTaken) {
      error({ title: "Name taken", description: "An environment with this name already exists." });
      return;
    }

    const result = await updateEnvironment(environment.id, { name: trimmed });
    if (!result.success) {
      error({ title: "Failed to rename", description: result.error || "Unknown error." });
      return;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Environment</DialogTitle>
          <DialogDescription>Update the display name for this environment.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <Label htmlFor="rename-environment">Name</Label>
          <Input
            id="rename-environment"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void handleRename()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleRename()}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
