import { useState } from "react";
import { ShieldCheck } from "lucide-react";

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

interface EnvironmentCreateDialogProps {
  createEnvironment: (name: string) => Promise<{ success: boolean; error?: string; id?: string }>;
  environments: Environment[];
  onCreated: (id: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function EnvironmentCreateDialog({
  createEnvironment,
  environments,
  onCreated,
  onOpenChange,
  open,
}: EnvironmentCreateDialogProps) {
  const { error } = useAppToast();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      error({ title: "Name required", description: "Please give the environment a name." });
      return;
    }

    if (environments.some((env) => env.name.toLowerCase() === trimmed.toLowerCase())) {
      error({ title: "Name taken", description: "An environment with this name already exists." });
      return;
    }

    let didCloseAfterCreate = false;
    setIsCreating(true);
    try {
      const result = await createEnvironment(trimmed);
      if (!result.success) {
        error({
          title: "Failed to create environment",
          description: result.error || "Unknown error occurred.",
        });
        return;
      }

      didCloseAfterCreate = true;
      onOpenChange(false);
      if (result.id) {
        onCreated(result.id);
      }
    } finally {
      if (!didCloseAfterCreate) {
        setIsCreating(false);
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isCreating && !nextOpen) {
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleExitComplete = () => {
    if (!open) {
      setName("");
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(event) => isCreating && event.preventDefault()}
        onExitComplete={handleExitComplete}
        onPointerDownOutside={(event) => isCreating && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Environment</DialogTitle>
          <DialogDescription>
            Add a legacy loopback environment for existing workspace bindings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="environment-name">Name</Label>
            <Input
              id="environment-name"
              placeholder="Full Stack Dev"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void handleCreate()}
            />
          </div>
          <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>macOS may request privileges to configure the loopback interface.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={isCreating} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isCreating} onClick={() => void handleCreate()}>
            {isCreating ? "Creating..." : "Create Environment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
