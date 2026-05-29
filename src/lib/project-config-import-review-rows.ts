import type { ProjectConfigImportReview } from "@/lib/project-config-import-review";

export type ProjectConfigImportReviewRowTone =
  | "default"
  | "destructive"
  | "warning";

export interface ProjectConfigImportReviewRow {
  action: string;
  id: string;
  state: string;
  target: string;
  tone: ProjectConfigImportReviewRowTone;
  area: string;
}

const serviceActionLabels: Record<ProjectConfigImportReview["servicesKind"], string> = {
  none: "Leave unchanged",
  remove: "Remove",
  save: "Replace",
};

export const buildProjectConfigImportReviewRows = (
  review: ProjectConfigImportReview,
): ProjectConfigImportReviewRow[] => {
  const rows: ProjectConfigImportReviewRow[] = [
    {
      id: "sync-targets",
      area: "Workspace Config Sync",
      action: "Replace",
      target: `${review.currentSyncTargetCount} -> ${review.syncTargetCount} targets`,
      state: "Ready",
      tone: "default",
    },
    {
      id: "project-services",
      area: "Project Services",
      action: serviceActionLabels[review.servicesKind],
      target:
        review.servicesKind === "save"
          ? `${review.currentServiceCount} -> ${review.serviceCount} services`
          : `${review.currentServiceCount} saved services`,
      state: review.servicesKind === "remove" ? "Will stop active workspaces" : "Ready",
      tone: review.servicesKind === "remove" ? "destructive" : "default",
    },
  ];

  if (review.externalConnectionCount > 0) {
    rows.push({
      id: "external-connections",
      area: "External service references",
      action: "Keep",
      target: `${review.externalConnectionCount} imported connections`,
      state: "Points to another Project Services topology",
      tone: "warning",
    });
  }

  return rows;
};
