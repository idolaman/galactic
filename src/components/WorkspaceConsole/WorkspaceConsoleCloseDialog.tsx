import { Power } from "lucide-react";
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
import type { WorkspaceConsoleSession } from "@/types/workspace-console";

interface WorkspaceConsoleCloseDialogProps {
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  session: WorkspaceConsoleSession | null;
}

export const WorkspaceConsoleCloseDialog = ({
  onConfirm,
  onOpenChange,
  session,
}: WorkspaceConsoleCloseDialogProps) => (
  <AlertDialog open={Boolean(session)} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Close running terminal?</AlertDialogTitle>
        <AlertDialogDescription>
          Closing {session?.workspaceLabel ?? "this terminal"} will stop the
          shell process and discard the terminal tab.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="gap-2">
          <Power className="h-4 w-4" />
          Kill Terminal
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
