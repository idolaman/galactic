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
import { getPreferredEditor } from "@/services/editor";

interface UpdateConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  version?: string;
}

export function UpdateConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  version,
}: UpdateConfirmDialogProps) {
  const editor = getPreferredEditor();
  const versionLabel = version ? `v${version}` : "the new version";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Install Update & Restart</AlertDialogTitle>
          <AlertDialogDescription>
            Installing {versionLabel} will restart Galactic and your {editor} windows.
            <br />
            <br />
            Your {editor} sessions will be automatically restored after the update.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Install & Restart
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
