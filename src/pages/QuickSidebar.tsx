import { useEffect, useMemo, useRef, useState } from "react";
import { Command as CommandIcon } from "lucide-react";
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
import { buildVisibleWorkspaceSessionMap } from "@/lib/workspace-session-display";
import { useSessionStore } from "@/stores/session-store";

const matchesSearch = (search: string, text: string) =>
  !search || text.toLowerCase().includes(search);

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

  const filteredProjects = useMemo(() => {
    if (!searchLower) {
      return projects;
    }

    return projects.filter((project) => {
      if (matchesSearch(searchLower, project.name) || matchesSearch(searchLower, "root")) {
        return true;
      }

      return (project.workspaces ?? []).some(
        (workspace) =>
          matchesSearch(searchLower, workspace.name) ||
          matchesSearch(searchLower, "worktree"),
      );
    });
  }, [projects, searchLower]);

  const handleLaunch = async (path: string) => {
    await launchWorkspace(path);
    window.electronAPI?.hideQuickSidebar?.();
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#050510] font-sans text-slate-100 selection:bg-purple-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050510] to-[#050510]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay" />
      <Command className="z-10 flex h-full flex-col bg-transparent" shouldFilter={false} loop value={selectedId} onValueChange={setSelectedId}>
        <QuickSidebarSearchHeader inputRef={searchInputRef} search={search} onSearchChange={setSearch} />
        <CommandList className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 flex-1 min-h-0 !max-h-none overflow-y-auto px-2 py-2">
          <CommandEmpty className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/20">
              <CommandIcon className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-white/40">No results found</p>
          </CommandEmpty>
          {filteredProjects.map((project) => (
            <QuickSidebarProjectGroup
              key={project.id}
              project={project}
              search={searchLower}
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
