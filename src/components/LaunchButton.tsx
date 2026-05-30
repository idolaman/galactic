import { useState } from "react";
import { RefreshCw } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { useWorkspaceNeedsRelaunch } from "@/hooks/use-workspace-relaunch";
import { cn } from "@/lib/utils";
import { setLaunchedEnvironment } from "@/services/workspace-state";

export interface LaunchButtonProps {
  path: string;
  environmentId: string | null;
  onLaunch: (path: string) => void;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline" | "link";
}

export const LaunchButton = ({
  path,
  environmentId,
  onLaunch,
  children,
  className,
  size = "default",
  variant = "default",
}: LaunchButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const needsRelaunch = useWorkspaceNeedsRelaunch(path, environmentId);

  const handleLaunch = () => {
    onLaunch(path);
    setLaunchedEnvironment(path, environmentId);
    setShowDialog(false);
  };

  if (!needsRelaunch) {
    return (
      <Button
        onClick={handleLaunch}
        className={className}
        size={size}
        variant={variant}
      >
        {children}
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className={cn(className, "bg-orange-600 hover:bg-orange-700 text-white border-orange-700")}
        size={size}
        variant={variant}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Relaunch
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relaunch Required</AlertDialogTitle>
            <AlertDialogDescription>
              To apply environment changes, you must manually close the existing editor window for this project.
              <br />
              <br />
              Once closed, click <strong>Launch</strong> to re-open it with the new settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="secondary"
              onClick={() => onLaunch(path)}
            >
              Focus Window
            </Button>
            <AlertDialogAction onClick={handleLaunch}>
              Launch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
