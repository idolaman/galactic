import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppToast } from "@/hooks/use-app-toast";
import { useDialogExitSnapshot } from "@/hooks/use-dialog-exit-snapshot";
import type { Environment } from "@/types/environment";

interface EnvironmentDeleteDialogProps {
  deleteEnvironment: (id: string) => Promise<{ success: boolean; error?: string }>;
  environment: Environment | null;
  onEnvironmentChange: (environment: Environment | null) => void;
}

export function EnvironmentDeleteDialog({
  deleteEnvironment,
  environment,
  onEnvironmentChange,
}: EnvironmentDeleteDialogProps) {
  const { error } = useAppToast();
  const {
    snapshot,
    handleExitComplete,
  } = useDialogExitSnapshot(environment);

  const handleDelete = async () => {
    if (!snapshot) return;

    try {
      const result = await deleteEnvironment(snapshot.id);
      if (!result.success) {
        error({
          title: "Failed to delete",
          description: result.error || "Could not remove loopback alias.",
        });
        return;
      }
    } finally {
      onEnvironmentChange(null);
    }
  };

  return (
    <AlertDialog
      open={Boolean(environment)}
      onOpenChange={(open) => !open && onEnvironmentChange(null)}
    >
      <AlertDialogContent onExitComplete={handleExitComplete}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Environment?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove loopback alias{" "}
            <span className="font-mono font-semibold">{snapshot?.address}</span>{" "}
            and detach all bindings. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => void handleDelete()}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
