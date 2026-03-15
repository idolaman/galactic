import { FolderGit2, GitBranch, HardDrive } from "lucide-react";
import { CommandGroup } from "@/components/ui/command";
import { normalizeWorkspacePath } from "@/lib/workspace-session-display";
import type { SessionSummary } from "@/services/session-rpc";
import type { StoredProject } from "@/services/projects";
import { QuickSidebarWorkspaceSection } from "@/components/QuickSidebar/QuickSidebarWorkspaceSection";

export interface QuickSidebarProjectGroupProps {
  project: StoredProject;
  search: string;
  sessionsByPath: Map<string, SessionSummary[]>;
  onLaunch: (path: string) => void | Promise<void>;
}

const matchesSearch = (search: string, text: string) =>
  !search || text.toLowerCase().includes(search);

export function QuickSidebarProjectGroup({
  project,
  search,
  sessionsByPath,
  onLaunch,
}: QuickSidebarProjectGroupProps) {
  const rootSessions = sessionsByPath.get(normalizeWorkspacePath(project.path)) ?? [];
  const showRoot =
    !search ||
    matchesSearch(search, project.name) ||
    matchesSearch(search, "root");
  const filteredWorkspaces = (project.workspaces ?? []).flatMap((workspace, index) =>
    search &&
    !matchesSearch(search, workspace.name) &&
    !matchesSearch(search, "worktree") &&
    !matchesSearch(search, project.name)
      ? []
      : [{ index, workspace }],
  );

  return (
    <CommandGroup
      heading={
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
          <FolderGit2 className="h-3 w-3" />
          <span>{project.name}</span>
        </div>
      }
      className="mb-1 [&_[cmdk-group-heading]]:px-0 [&_[cmdk-group-heading]]:pb-0"
    >
      {showRoot && (
        <QuickSidebarWorkspaceSection
          icon={HardDrive}
          itemValue={`${project.name} root`.toLowerCase()}
          label="Repository Root"
          meta={project.path}
          tone="root"
          onSelect={() => void onLaunch(project.path)}
          sessions={rootSessions}
        />
      )}
      {filteredWorkspaces.map(({ index, workspace }) => (
        <QuickSidebarWorkspaceSection
          key={workspace.workspace}
          icon={GitBranch}
          itemValue={`${project.name} workspace-${index} ${workspace.name}`.toLowerCase()}
          label={workspace.name}
          meta="Worktree"
          tone="workspace"
          onSelect={() => void onLaunch(workspace.workspace)}
          sessions={sessionsByPath.get(normalizeWorkspacePath(workspace.workspace)) ?? []}
        />
      ))}
    </CommandGroup>
  );
}
