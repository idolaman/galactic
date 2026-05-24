import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkspaceIsolationDeleteConfirmationDialogProps {
  isRemoving: boolean;
  open: boolean;
  onConfirm: () => void;
  onExitComplete?: () => void;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceIsolationDeleteConfirmationDialog = ({
  isRemoving,
  open,
  onConfirm,
  onExitComplete,
  onOpenChange,
}: WorkspaceIsolationDeleteConfirmationDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent onExitComplete={onExitComplete}>
      <AlertDialogHeader>
        <AlertDialogTitle>Remove Project Services?</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="grid gap-3 text-sm">
            <p>
              This removes the saved service map and stops active Project
              Services workspaces for this project.
            </p>
            <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>This action changes active local routing.</span>
            </div>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          disabled={isRemoving}
          onClick={onConfirm}
        >
          {isRemoving ? "Removing..." : "Remove Project Services"}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
