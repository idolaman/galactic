import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDialogExitSnapshot } from "@/hooks/use-dialog-exit-snapshot";
import { buildProjectConfigImportReviewRows } from "@/lib/project-config-import-review-rows";
import type { ProjectConfigImportReview } from "@/lib/project-config-import-review";

interface ProjectConfigImportReviewDialogProps {
  review: ProjectConfigImportReview | null;
  isApplying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const rowToneClassNames = {
  default: "border-border text-muted-foreground",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
} as const;

const getFinalWarning = (review: ProjectConfigImportReview): string | null => {
  if (review.servicesKind === "remove") {
    return "Importing this config removes Project Services and stops active Project Services workspaces for this project.";
  }
  if (review.externalConnectionCount > 0) {
    return "Some imported connections still reference Project Services from another topology.";
  }

  return null;
};

export const ProjectConfigImportReviewDialog = ({
  review,
  isApplying,
  onCancel,
  onConfirm,
}: ProjectConfigImportReviewDialogProps) => {
  const { snapshot: displayReview, handleExitComplete } =
    useDialogExitSnapshot(review);
  const [displayIsApplying, setDisplayIsApplying] = useState(isApplying);

  useEffect(() => {
    if (review) {
      setDisplayIsApplying(isApplying);
    }
  }, [isApplying, review]);

  if (!displayReview) {
    return null;
  }

  return (
    <AlertDialog open={Boolean(review)} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-2xl" onExitComplete={handleExitComplete}>
        <AlertDialogHeader>
          <AlertDialogTitle>Review project config import</AlertDialogTitle>
          <AlertDialogDescription>
            Confirm exactly what Galactic will apply to this project's saved setup.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildProjectConfigImportReviewRows(displayReview).map((row) => (
                  <TableRow key={row.id} className="hover:bg-transparent">
                    <TableCell className="font-medium">{row.area}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={rowToneClassNames[row.tone]}
                      >
                        {row.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.target}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.state}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {getFinalWarning(displayReview) ? (
            <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{getFinalWarning(displayReview)}</span>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={displayIsApplying}>
            Cancel
          </AlertDialogCancel>
          <Button disabled={displayIsApplying} onClick={onConfirm}>
            {displayIsApplying ? "Importing..." : "Import config"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
