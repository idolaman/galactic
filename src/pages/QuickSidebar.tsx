import { useEffect, useMemo, useState } from "react";
import { FolderGit2, GitBranch, HardDrive, Rocket, Check, Clock, AlertCircle, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useProjects } from "@/hooks/use-projects";
import { useSessionStore } from "@/stores/session-store";
import { useEditorLauncher } from "@/hooks/use-editor-launcher";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/services/session-rpc";

const normalizePath = (value: string) => value.replace(/\/+$/, "").toLowerCase();

const getStatusMeta = (session: SessionSummary) => {
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
      label: "Done",
      icon: Check,
      className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    };
  if (isApproval)
    return {
      label: "Action",
      icon: AlertCircle,
      className: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    };
  if (isOverdue)
    return {
      label: "Slow",
      icon: Clock,
      className: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    };
  return {
    label: "Running",
    icon: Loader2,
    className: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  };
};

export function QuickSidebar() {
  const projects = useProjects();
  const { sessions, startPolling, stopPolling } = useSessionStore();
  const { launchWorkspace } = useEditorLauncher();
  const [search, setSearch] = useState("");

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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  const handleLaunch = (path: string) => {
    launchWorkspace(path);
    window.electronAPI?.hideQuickSidebar?.();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950/60 text-slate-100 backdrop-blur-xl">
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.05),transparent_50%)] pointer-events-none" />

      <Command
        className="bg-transparent"
        shouldFilter={true}
        loop
      >
        <div className="flex flex-col border-b border-white/5 pt-11 px-4 pb-2">
          <div className="mb-3 flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <Rocket className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white/90">
              Galactic Launcher
            </span>
          </div>
          <CommandInput
            placeholder="Search projects & workspaces..."
            value={search}
            onValueChange={setSearch}
            wrapperClassName="border-none px-3 bg-white/5 rounded-lg h-10 items-center transition-all focus-within:ring-1 focus-within:ring-cyan-500/50"
            className="h-full border-0 bg-transparent px-0 text-sm text-white placeholder:text-white/40 focus:ring-0 font-light"
          />
        </div>

        <CommandList className="max-h-[calc(100vh-100px)] overflow-y-auto px-2 py-2 scrollbar-none [mask-image:linear-gradient(to_bottom,transparent,black_10px,black_calc(100%-10px),transparent)]">
          <CommandEmpty className="py-8 text-center text-sm text-white/30">

            No projects found.
          </CommandEmpty>

          {projects.map((project) => {
            const rootSessions = getSessionsFor(project.path);

            return (
              <CommandGroup
                key={project.id}
                heading={
                  <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    <FolderGit2 className="h-3.5 w-3.5" />
                    <span>{project.name}</span>
                  </div>
                }
                className="mb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3"
              >
                <CommandItem
                  value={`${project.name} root`}
                  onSelect={() => handleLaunch(project.path)}
                  className="group relative mb-1 flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200 data-[selected=true]:bg-white/10 data-[selected=true]:text-white data-[disabled]:opacity-50"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-white/20 text-white shadow-sm ring-1 ring-white/10 group-data-[selected=true]:bg-cyan-500/20 group-data-[selected=true]:text-cyan-400 group-data-[selected=true]:ring-cyan-500/20 transition-all">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <span className="font-bold text-white group-data-[selected=true]:text-white transition-colors">Repository Root</span>
                    <span className="text-[10px] text-white truncate max-w-[200px]">{project.path}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rootSessions.map((session) => {
                      const { icon: StatusIcon, className, label } = getStatusMeta(session);
                      return (
                        <div
                          key={session.id}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md",
                            className
                          )}
                        >
                          <StatusIcon className={cn("h-3 w-3", label === "Running" && "animate-spin")} />
                          <span className="hidden sm:inline-block">{label}</span>
                        </div>
                      );
                    })}
                    <div className="opacity-0 group-data-[selected=true]:opacity-100 transition-opacity text-white/70 font-medium text-[10px]">
                      Enter ↵
                    </div>
                  </div>
                </CommandItem>

                {project.workspaces?.map((workspace) => {
                  const wsSessions = getSessionsFor(workspace.workspace);
                  return (
                    <CommandItem
                      key={workspace.workspace}
                      value={`${project.name} ${workspace.name}`}
                      onSelect={() => handleLaunch(workspace.workspace)}
                      className="group relative mb-1 flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200 data-[selected=true]:bg-white/10 data-[selected=true]:text-white data-[disabled]:opacity-50"
                    >
                      <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-white/20 text-white shadow-sm ring-1 ring-white/10 group-data-[selected=true]:bg-violet-500/20 group-data-[selected=true]:text-violet-400 group-data-[selected=true]:ring-violet-500/20 transition-all">
                        <GitBranch className="h-4 w-4" />
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <span className="font-bold text-white group-data-[selected=true]:text-white transition-colors">{workspace.name}</span>
                        <span className="text-[10px] text-white">Worktree</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {wsSessions.map((session) => {
                          const { icon: StatusIcon, className, label } = getStatusMeta(session);
                          return (
                            <div
                              key={session.id}
                              className={cn(
                                "flex items-center gap-1.5 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md",
                                className
                              )}
                            >
                              <StatusIcon className={cn("h-3 w-3", label === "Running" && "animate-spin")} />
                              <span className="hidden sm:inline-block">{label}</span>
                            </div>
                          );
                        })}
                        <div className="opacity-0 group-data-[selected=true]:opacity-100 transition-opacity text-white/70 font-medium text-[10px]">
                          Enter ↵
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>

        <div className="flex items-center justify-between border-t border-white/10 bg-black/40 px-4 py-2.5 text-[10px] text-white/70 backdrop-blur-md">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="font-sans bg-white/10 px-1 rounded text-white">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="font-sans bg-white/10 px-1 rounded text-white">↵</kbd> select</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="font-sans bg-white/10 px-1 rounded text-white">esc</kbd> close</span>
        </div>
      </Command>
    </div>
  );
}
