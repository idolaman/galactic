import { FolderGit2, GitBranch, HardDrive } from "lucide-react";
import { CommandGroup } from "@/components/ui/command";
import type { QuickLauncherProjectResult } from "@/lib/quick-launcher-results";
import { normalizeWorkspacePath } from "@/lib/workspace-session-display";
import type { SessionSummary } from "@/services/session-rpc";
import { QuickSidebarWorkspaceSection } from "@/components/QuickSidebar/QuickSidebarWorkspaceSection";

export interface QuickSidebarProjectGroupProps {
  result: QuickLauncherProjectResult;
  sessionsByPath: Map<string, SessionSummary[]>;
  onLaunch: (path: string) => void | Promise<void>;
}

export function QuickSidebarProjectGroup({
  result,
  sessionsByPath,
  onLaunch,
}: QuickSidebarProjectGroupProps) {
  const { project, showRoot, workspaces } = result;
  const rootSessions = sessionsByPath.get(normalizeWorkspacePath(project.path)) ?? [];

  return (
    <CommandGroup
      heading={
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
      {workspaces.map(({ index, workspace }) => (
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
