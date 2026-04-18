import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceIsolationIntroStep } from "@/components/WorkspaceIsolationIntroStep";
import { trackWorkspaceIsolationInfoDialogOpened } from "@/services/workspace-isolation-analytics";

export function WorkspaceIsolationFeatureIntroDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="link"
        className="h-auto p-0 text-xs"
        onClick={() => {
          trackWorkspaceIsolationInfoDialogOpened();
          setOpen(true);
        }}
      >
        What this feature does
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>What Project Services does</DialogTitle>
            <DialogDescription>
              See how Galactic gives each workspace its own routed local surface
              before you enable Terminal Auto-Env.
            </DialogDescription>
          </DialogHeader>
          <WorkspaceIsolationIntroStep />
        </DialogContent>
      </Dialog>
    </>
  );
}
