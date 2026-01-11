import { useEffect, useMemo, useRef, useState } from "react";
import { FolderGit2, GitBranch, HardDrive, Rocket, Check, Clock, AlertCircle, Loader2, X, Search, Command as CommandIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useProjects } from "@/hooks/use-projects";
import { useSessionStore } from "@/stores/session-store";
import { useEditorLauncher } from "@/hooks/use-editor-launcher";
import { useQuickLauncherAnalytics } from "@/hooks/use-quick-launcher-analytics";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/services/session-rpc";

const normalizePath = (value: string) => value.replace(/\/+$/, "").toLowerCase();

const getStatusConfig = (session: SessionSummary) => {
  const isDone = session.status === "done";
  const isApproval = !!session.approval_pending_since && !isDone;
  const hasTiming = session.started_at && session.estimated_duration;
  const isOverdue =
    !isDone &&
    hasTiming &&
    Date.now() - new Date(session.started_at ?? 0).getTime() >
    (session.estimated_duration ?? 0) * 2000;

  if (isDone)
    return {
      label: "Completed",
      icon: Check,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    };
  if (isApproval)
    return {
      label: "Needs Action",
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    };
  if (isOverdue)
    return {
      label: "Slow",
      icon: Clock,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    };
  return {
    label: "Running",
    icon: Loader2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  };
};

function SessionItem({ session }: { session: SessionSummary }) {
  const ackSession = useSessionStore(s => s.ackSession);
  const { icon: StatusIcon, color, label } = getStatusConfig(session);
  const isRunning = label === "Running";
  const isDone = session.status === "done";
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      ackSession(session.id, isDone ? "done" : "run");
    }, 300);
  };

  return (
    <div
      className={cn(
        "relative pl-9 group/session transition-all duration-300 ease-out origin-top w-full",
        isExiting ? "opacity-0 -translate-y-2 scale-95 max-h-0 py-0 overflow-hidden pointer-events-none" : "opacity-100 max-h-[100px]"
      )}
    >
      {/* Tree Connector: Align to parent center (20px) */}
      <div className={cn(
        "absolute left-5 top-[-50%] bottom-0 w-px bg-white/10 group-last/session:bottom-1/2 transition-opacity",
        isExiting && "opacity-0"
      )} />

      {/* Horizontal Branch: 20px -> 36px (length 16px) */}
      <div className={cn(
        "absolute left-5 top-1/2 w-4 h-px bg-white/10 transition-all",
        isExiting && "opacity-0"
      )} />

      {/* Main Card */}
      <div className={cn(
        "flex h-7 items-center gap-2.5 rounded-md px-2 pr-2 border transition-all duration-200 relative overflow-hidden",
        "bg-transparent hover:bg-white/[0.04] group-data-[selected=true]:bg-white/[0.06]",
        "border-transparent group-hover/session:border-white/5 group-data-[selected=true]:border-white/5",
        isExiting && "scale-[0.98] blur-[2px]"
      )}>
        {/* Compact Icon */}
        <div
          className={cn(
            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded transition-all",
            color,
            isRunning && "animate-spin"
          )}
          title={label}
        >
          <StatusIcon className="h-3 w-3" />
        </div>

        {/* Title & Info */}
        <div className="flex flex-1 items-center min-w-0 gap-2">
          <span className={cn(
            "text-[11px] font-medium truncate transition-colors flex-1",
            isDone ? "text-slate-500" : "text-slate-300 group-hover/session:text-slate-200"
          )}>
            {session.title}
          </span>
          {session.started_at && (
            <span className="text-[9px] text-slate-600 font-mono shrink-0 opacity-0 group-hover/session:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity">
              {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Dismiss Button - very subtle */}
        <button
          onClick={handleDismiss}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded transition-all duration-200 -mr-1",
            "opacity-0 group-hover/session:opacity-100 group-data-[selected=true]:opacity-100",
            "hover:bg-white/10 text-slate-500 hover:text-slate-300"
          )}
          title={isDone ? "Clear session" : "Dismiss session"}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

export function QuickSidebar() {
  const projects = useProjects();
  const { sessions, startPolling, stopPolling } = useSessionStore();
  const { launchWorkspace } = useEditorLauncher();
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  useQuickLauncherAnalytics({ selectedId, sessions });

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.electronAPI?.hideQuickSidebar?.();
      }

      // Handle deletion shortcut (Backspace)
      if (e.key === "Backspace" && e.metaKey && selectedId) {
        const session = sessions.find(s => `session-${s.id}` === selectedId);
        if (!session) return;

        e.preventDefault();
        const isDone = session.status === "done";
        useSessionStore.getState().ackSession(session.id, isDone ? "done" : "run");
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

  const sessionsByPath = useMemo(() => {
    const map = new Map<string, SessionSummary[]>();
    sessions.forEach((session) => {
      if (!session.workspace_path) return;
      const key = normalizePath(session.workspace_path);
      const list = map.get(key) ?? [];
      list.push(session);
      map.set(key, list);
    });
    return map;
  }, [sessions]);

  const getSessionsFor = (path: string) =>
    sessionsByPath.get(normalizePath(path)) ?? [];

  // Manual filtering to preserve order
  const searchLower = search.toLowerCase().trim();
  const matchesSearch = (text: string) => !searchLower || text.toLowerCase().includes(searchLower);

  // Sessions ride along with their workspace; search only matches project/workspace labels.
  const filteredProjects = useMemo(() => {
    if (!searchLower) return projects;

    return projects.filter(project => {
      if (matchesSearch(project.name)) return true;
      if (matchesSearch("root")) return true;
      if (project.workspaces?.some(ws => matchesSearch(ws.name) || matchesSearch("worktree"))) return true;
      return false;
    });
  }, [projects, searchLower]);

  const handleLaunch = async (path: string) => {
    await launchWorkspace(path);
    window.electronAPI?.hideQuickSidebar?.();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#050510] text-slate-100 font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050510] to-[#050510] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />

      <Command
        className="bg-transparent z-10 flex flex-col h-full"
        shouldFilter={false}
        loop
        value={selectedId}
        onValueChange={setSelectedId}
      >
        {/* Header Section */}
        <div className="shrink-0 pt-7 px-5 pb-3 space-y-3 border-b border-white/5 bg-[#050510]/50 backdrop-blur-sm">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative flex items-center bg-white/5 rounded-lg border border-white/5 shadow-sm transition-all group-focus-within:border-white/10 group-focus-within:bg-[#0A0A15]">
              <Search className="ml-3 h-3.5 w-3.5 text-white/30 group-focus-within:text-white/50 transition-colors" />
              <CommandInput
                placeholder="Search projects & workspaces..."
                value={search}
                onValueChange={setSearch}
                ref={searchInputRef}
                autoFocus
                hideIcon
                wrapperClassName="border-none px-0 h-9 flex-1 bg-transparent"
                className="h-full border-0 bg-transparent px-3 text-sm text-white placeholder:text-white/20 focus:ring-0 font-medium"
              />
              <div className="mr-2 flex items-center gap-2">
                <div className="flex items-center gap-1.5 opacity-50">
                  <Rocket className="h-3 w-3 text-indigo-400" />
                  <span className="text-[10px] font-medium tracking-wide uppercase text-indigo-300">Galactic</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CommandList className="flex-1 min-h-0 !max-h-none overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <CommandEmpty className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/20">
              <CommandIcon className="h-5 w-5" />
            </div>
            <p className="text-xs text-white/40 font-medium">No results found</p>
          </CommandEmpty>

          {filteredProjects.map((project) => {
            const rootSessions = getSessionsFor(project.path);
            const projectValue = `${project.name} root`.toLowerCase();
            const showRoot = !searchLower || matchesSearch(project.name) || matchesSearch("root");
            const visibleRootSessions = showRoot ? rootSessions : [];
            const filteredWorkspaces = searchLower
              ? (project.workspaces ?? []).filter(ws =>
                matchesSearch(ws.name) || matchesSearch("worktree") || matchesSearch(project.name)
              )
              : (project.workspaces ?? []);

            return (
              <CommandGroup
                key={project.id}
                heading={
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    <FolderGit2 className="h-3 w-3" />
                    <span>{project.name}</span>
                  </div>
                }
                className="[&_[cmdk-group-heading]]:px-0 [&_[cmdk-group-heading]]:pb-0 mb-1"
              >
                {showRoot && (
                  <div className="relative">
                    {/* Spine Logic: starts from center of parent icon (20px) */}
                    {visibleRootSessions.length > 0 && (
                      <div className="absolute left-5 top-5 bottom-0 w-px bg-white/10" />
                    )}

                    <CommandItem
                      value={projectValue}
                      onSelect={() => handleLaunch(project.path)}
                      className="group relative flex cursor-pointer select-none flex-col rounded-lg p-0 outline-none transition-all duration-200 data-[selected=true]:bg-white/5 my-0.5"
                    >
                      <div className="flex w-full items-center px-2 py-1.5 gap-3 rounded-lg border border-transparent group-data-[selected=true]:border-white/5 transition-all relative">
                        {/* Parent Icon: 24px box (w-6) + px-2 padding -> center at 8 + 12 = 20px */}
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-slate-400 group-data-[selected=true]:from-indigo-600 group-data-[selected=true]:to-indigo-700 group-data-[selected=true]:text-white group-data-[selected=true]:border-transparent transition-all z-10">
                          <HardDrive className="h-3.5 w-3.5" />
                        </div>

                        <div className="flex flex-1 items-baseline gap-2 min-w-0 overflow-hidden">
                          <span className="font-semibold text-slate-300 text-xs group-data-[selected=true]:text-white transition-colors truncate">Repository Root</span>
                          <span className="text-[10px] text-slate-600 truncate font-mono max-w-[200px] hidden sm:inline-block">{project.path}</span>
                        </div>

                        <div className="opacity-0 group-data-[selected=true]:opacity-100 transition-all text-white/40 text-[10px] flex items-center gap-1">
                          <span className="text-indigo-400/80">Open</span> <kbd className="font-sans">↵</kbd>
                        </div>
                      </div>
                    </CommandItem>

                    {/* Sessions */}
                    <div className="relative">
                      {visibleRootSessions.map((session) => (
                        <CommandItem
                          key={session.id}
                          value={`session-${session.id}`}
                          onSelect={() => { }}
                          className="group relative flex w-full cursor-pointer select-none flex-col items-stretch outline-none transition-all data-[selected=true]:bg-transparent focus-visible:outline-none"
                        >
                          <SessionItem session={session} />
                        </CommandItem>
                      ))}
                    </div>
                  </div>
                )}

                {filteredWorkspaces.map((workspace, idx) => {
                  const wsSessions = getSessionsFor(workspace.workspace);
                  // Find original index
                  const originalIndex = (project.workspaces ?? []).indexOf(workspace);

                  return (
                    <div key={workspace.workspace} className="relative mt-0.5">
                      {wsSessions.length > 0 && (
                        <div className="absolute left-5 top-5 bottom-0 w-px bg-white/10" />
                      )}

                      <CommandItem
                        value={`${project.name} workspace-${originalIndex} ${workspace.name}`.toLowerCase()}
                        onSelect={() => handleLaunch(workspace.workspace)}
                        className="group relative flex cursor-pointer select-none flex-col rounded-lg p-0 outline-none transition-all duration-200 data-[selected=true]:bg-white/5 my-0.5"
                      >
                        <div className="flex w-full items-center px-2 py-1.5 gap-3 rounded-lg border border-transparent group-data-[selected=true]:border-white/5 transition-all relative">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-slate-400 group-data-[selected=true]:from-cyan-600 group-data-[selected=true]:to-cyan-700 group-data-[selected=true]:text-white group-data-[selected=true]:border-transparent transition-all z-10">
                            <GitBranch className="h-3.5 w-3.5" />
                          </div>

                          <div className="flex flex-1 items-baseline gap-2 min-w-0">
                            <span className="font-semibold text-slate-300 text-xs group-data-[selected=true]:text-white transition-colors truncate">{workspace.name}</span>
                            <span className="text-[10px] text-slate-600 truncate">Worktree</span>
                          </div>

                          <div className="opacity-0 group-data-[selected=true]:opacity-100 transition-all text-white/40 text-[10px] flex items-center gap-1">
                            <span className="text-cyan-400/80">Open</span> <kbd className="font-sans">↵</kbd>
                          </div>
                        </div>
                      </CommandItem>

                      {/* Sessions */}
                      <div className="relative">
                        {wsSessions.map(session => (
                          <CommandItem
                            key={session.id}
                            value={`session-${session.id}`}
                            onSelect={() => { }}
                            className="group relative flex w-full cursor-pointer select-none flex-col items-stretch outline-none transition-all data-[selected=true]:bg-transparent focus-visible:outline-none"
                          >
                            <SessionItem session={session} />
                          </CommandItem>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>

        <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-[#0A0A15]/80 px-3 py-1.5 text-[10px] text-white/30 backdrop-blur-md">
          <div className="flex gap-2">
            <span className="flex items-center gap-1"><span className="text-white/50">↑↓</span> nav</span>
            <span className="flex items-center gap-1"><span className="text-white/50">↵</span> open</span>
            <span className="flex items-center gap-1"><span className="text-white/50">⌘⌫</span> del</span>
          </div>
          <span className="flex items-center gap-1"><span className="text-white/50">esc</span> close</span>
        </div>
      </Command>
    </div>
  );
}
