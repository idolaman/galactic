import { useEffect, useMemo, useRef, useState } from "react";
import { FolderSearch, SearchX } from "lucide-react";
import { QuickSidebarFooter } from "@/components/QuickSidebar/QuickSidebarFooter";
import { QuickSidebarProjectGroup } from "@/components/QuickSidebar/QuickSidebarProjectGroup";
import { QuickSidebarSearchHeader } from "@/components/QuickSidebar/QuickSidebarSearchHeader";
import {
  Command,
  CommandEmpty,
  CommandList,
} from "@/components/ui/command";
import { useEditorLauncher } from "@/hooks/use-editor-launcher";
import { useProjects } from "@/hooks/use-projects";
import { useQuickLauncherAnalytics } from "@/hooks/use-quick-launcher-analytics";
import { getQuickLauncherResults } from "@/lib/quick-launcher-results";
import { buildVisibleWorkspaceSessionMap } from "@/lib/workspace-session-display";
import { useSessionStore } from "@/stores/session-store";

export function QuickSidebar() {
  const projects = useProjects();
  const { sessions, startPolling, stopPolling } = useSessionStore();
  const { launchWorkspace } = useEditorLauncher();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const searchLower = search.toLowerCase().trim();
  const sessionsByPath = useMemo(
    () => buildVisibleWorkspaceSessionMap(sessions),
    [sessions],
  );

  useQuickLauncherAnalytics({ selectedId, sessions });

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.electronAPI?.hideQuickSidebar?.();
      }

      if (event.key === "Backspace" && event.metaKey && selectedId) {
        const session = sessions.find((entry) => `session-${entry.id}` === selectedId);
        if (!session) {
          return;
        }

        event.preventDefault();
        useSessionStore.getState().ackSession(session.id, session.status === "done" ? "done" : "run");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, sessions]);

  useEffect(() => {
    const focusSearch = () => {
      searchInputRef.current?.focus({ preventScroll: true });
      searchInputRef.current?.select();
    };

    focusSearch();
    window.addEventListener("focus", focusSearch);
    return () => window.removeEventListener("focus", focusSearch);
  }, []);

  const results = useMemo(
    () => getQuickLauncherResults(projects, searchLower),
    [projects, searchLower],
  );

  const handleLaunch = async (path: string) => {
    await launchWorkspace(path);
    window.electronAPI?.hideQuickSidebar?.();
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans text-foreground selection:bg-primary/20">
      <Command className="flex h-full flex-col rounded-none bg-background" shouldFilter={false} loop value={selectedId} onValueChange={setSelectedId}>
        <QuickSidebarSearchHeader inputRef={searchInputRef} search={search} onSearchChange={setSearch} />
        <CommandList className="min-h-0 flex-1 !max-h-none overflow-y-auto px-2 py-2">
          <CommandEmpty className="hidden" />
          {(results.isEmpty || results.isNoResults) && (
            <div className="flex flex-col items-center justify-center gap-3 px-8 py-14 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                {results.isEmpty ? <FolderSearch className="h-5 w-5" /> : <SearchX className="h-5 w-5" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {results.isEmpty ? "No projects yet" : "No matching workspace"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {results.isEmpty
                    ? "Add a project in Galactic to open it from here."
                    : "Try a project name, workspace name, root, or worktree."}
                </p>
              </div>
            </div>
          )}
          {results.projects.map((result) => (
            <QuickSidebarProjectGroup
              key={result.project.id}
              result={result}
              sessionsByPath={sessionsByPath}
              onLaunch={handleLaunch}
            />
          ))}
        </CommandList>
        <QuickSidebarFooter />
      </Command>
    </div>
  );
}
