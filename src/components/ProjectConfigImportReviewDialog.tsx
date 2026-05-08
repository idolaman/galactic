import {
  AlertTriangle,
  FileCode,
  GitBranch,
  Network,
} from "lucide-react";
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
import type { ProjectConfigImportReview } from "@/lib/project-config-import-review";

interface ProjectConfigImportReviewDialogProps {
  review: ProjectConfigImportReview | null;
  isApplying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const getServicesSummary = (review: ProjectConfigImportReview): string => {
  const summaries: Record<ProjectConfigImportReview["servicesKind"], string> = {
    save: `Replace ${review.currentServiceCount} Project Services with ${review.serviceCount} imported services.`,
    remove: `Remove the current ${review.currentServiceCount} Project Services because the file has no Project Services metadata.`,
    none: "Leave Project Services unset because the file has no Project Services metadata.",
  };
  return summaries[review.servicesKind];
};

export const ProjectConfigImportReviewDialog = ({
  review,
  isApplying,
  onCancel,
  onConfirm,
}: ProjectConfigImportReviewDialogProps) => review ? (
  <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent className="max-w-xl">
      <AlertDialogHeader>
        <AlertDialogTitle>Review project config import</AlertDialogTitle>
        <AlertDialogDescription>
          Confirm the changes before Galactic replaces this project's saved setup.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-3">
        <div className="flex gap-3 rounded-md border bg-muted/30 p-3">
          <FileCode className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">Workspace Config Sync</p>
            <p className="text-muted-foreground">
              Replace {review.currentSyncTargetCount} targets with{" "}
              {review.syncTargetCount} imported targets.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-md border bg-muted/30 p-3">
          <GitBranch className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">Project Services</p>
            <p className="text-muted-foreground">{getServicesSummary(review)}</p>
          </div>
        </div>

        {review.externalConnectionCount > 0 ? (
          <div className="flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <Network className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-400" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">External service references remain</p>
              <p className="text-muted-foreground">
                {review.externalConnectionCount} imported connections still point
                to another Project Services topology.
              </p>
            </div>
          </div>
        ) : null}

        {review.servicesKind === "remove" ? (
          <div className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Removing Project Services also stops active Project Services
              workspaces for this project.
            </p>
          </div>
        ) : null}
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isApplying}>
          Cancel
        </AlertDialogCancel>
        <Button disabled={isApplying} onClick={onConfirm}>
          {isApplying ? "Importing..." : "Import config"}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
) : null;
