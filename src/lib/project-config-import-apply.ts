import type { ProjectConfigImportReview } from "./project-config-import-review.js";
import type { SyncTarget } from "../types/sync-target.js";
import type { WorkspaceIsolationProjectTopology } from "../types/workspace-isolation.js";

interface ProjectConfigImportProject {
  id: string;
  name: string;
  path: string;
  isGitRepo: boolean;
  syncTargets?: SyncTarget[];
}

interface ApplyProjectConfigImportOptions<TProject extends ProjectConfigImportProject> {
  project: TProject;
  review: ProjectConfigImportReview;
  currentTopology: WorkspaceIsolationProjectTopology | null;
  saveProjectTopology: (
    input: ProjectConfigImportReview["action"]["projectServices"] extends infer Action
      ? Action extends { type: "save"; input: infer Input }
        ? Input
        : never
      : never,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteProjectTopology: (
    topologyId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateProject: (next: TProject) => void;
}

export const applyProjectConfigImport = async <
  TProject extends ProjectConfigImportProject,
>({
  project,
  review,
  currentTopology,
  saveProjectTopology,
  deleteProjectTopology,
  updateProject,
}: ApplyProjectConfigImportOptions<TProject>): Promise<void> => {
  if (review.action.projectServices.type === "save") {
    const saveResult = await saveProjectTopology(
      review.action.projectServices.input,
    );
    if (!saveResult.success) {
      throw new Error(saveResult.error ?? "Unable to save Project Services.");
    }
  } else if (currentTopology) {
    const deleteResult = await deleteProjectTopology(currentTopology.id);
    if (!deleteResult.success) {
      throw new Error(deleteResult.error ?? "Unable to remove Project Services.");
    }
  }

  updateProject({
    ...project,
    syncTargets: review.action.syncTargets,
  });
};
