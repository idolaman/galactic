import type { StoredProject } from "@/services/projects";
import type { Workspace } from "@/types/workspace";

export interface QuickLauncherWorkspaceResult {
  index: number;
  workspace: Workspace;
}

export interface QuickLauncherProjectResult {
  project: StoredProject;
  showRoot: boolean;
  workspaces: QuickLauncherWorkspaceResult[];
}

export interface QuickLauncherResults {
  hasProjects: boolean;
  hasQuery: boolean;
  isEmpty: boolean;
  isNoResults: boolean;
  projects: QuickLauncherProjectResult[];
}

const matchesSearch = (search: string, text: string) =>
  !search || text.toLowerCase().includes(search);

export const getQuickLauncherResults = (
  projects: StoredProject[],
  query: string,
): QuickLauncherResults => {
  const search = query.toLowerCase().trim();
  const results = projects.flatMap((project) => {
    const projectMatches = matchesSearch(search, project.name);
    const showRoot = !search || projectMatches || matchesSearch(search, "root");
    const workspaces = (project.workspaces ?? []).flatMap((workspace, index) =>
      search &&
      !projectMatches &&
      !matchesSearch(search, workspace.name) &&
      !matchesSearch(search, "worktree")
        ? []
        : [{ index, workspace }],
    );

    if (!showRoot && workspaces.length === 0) {
      return [];
    }

    return [{ project, showRoot, workspaces }];
  });

  return {
    hasProjects: projects.length > 0,
    hasQuery: search.length > 0,
    isEmpty: projects.length === 0,
    isNoResults: projects.length > 0 && results.length === 0,
    projects: results,
  };
};
