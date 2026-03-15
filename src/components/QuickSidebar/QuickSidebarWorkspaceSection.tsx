import type { ElementType } from "react";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/services/session-rpc";
import { QuickSidebarSessionItem } from "@/components/QuickSidebar/QuickSidebarSessionItem";

interface ToneConfig {
  accentText: string;
  activeBackground: string;
}

export interface QuickSidebarWorkspaceSectionProps {
  icon: ElementType;
  itemValue: string;
  label: string;
  meta: string;
  tone: "root" | "workspace";
  onSelect: () => void;
  sessions: SessionSummary[];
}

const toneConfig: Record<QuickSidebarWorkspaceSectionProps["tone"], ToneConfig> = {
  root: {
    accentText: "text-indigo-400/80",
    activeBackground:
      "group-data-[selected=true]:from-indigo-600 group-data-[selected=true]:to-indigo-700",
  },
  workspace: {
    accentText: "text-cyan-400/80",
    activeBackground:
      "group-data-[selected=true]:from-cyan-600 group-data-[selected=true]:to-cyan-700",
  },
};

export function QuickSidebarWorkspaceSection({
  icon: Icon,
  itemValue,
  label,
  meta,
  tone,
  onSelect,
  sessions,
}: QuickSidebarWorkspaceSectionProps) {
  const styles = toneConfig[tone];

  return (
    <div className="relative mt-0.5">
      {sessions.length > 0 && (
        <div className="absolute bottom-0 left-5 top-5 w-px bg-white/10" />
      )}
      <CommandItem
        value={itemValue}
        onSelect={onSelect}
        className="group relative my-0.5 flex cursor-pointer select-none flex-col rounded-lg p-0 outline-none transition-all duration-200 data-[selected=true]:bg-white/5"
      >
        <div className="relative flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-all group-data-[selected=true]:border-white/5">
          <div
            className={cn(
              "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400 transition-all group-data-[selected=true]:border-transparent group-data-[selected=true]:text-white",
              styles.activeBackground,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden">
            <span className="truncate text-xs font-semibold text-slate-300 transition-colors group-data-[selected=true]:text-white">
              {label}
            </span>
            <span
              className={cn(
                "truncate text-[10px] text-slate-600",
                tone === "root" ? "hidden font-mono sm:inline-block max-w-[200px]" : "",
              )}
            >
              {meta}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/40 opacity-0 transition-all group-data-[selected=true]:opacity-100">
            <span className={styles.accentText}>Open</span>
            <kbd className="font-sans">↵</kbd>
          </div>
        </div>
      </CommandItem>
      <div className="relative">
        {sessions.map((session) => (
          <CommandItem
            key={session.id}
            value={`session-${session.id}`}
            onSelect={() => {}}
            className="group relative flex w-full cursor-pointer select-none flex-col items-stretch outline-none transition-all data-[selected=true]:bg-transparent focus-visible:outline-none"
          >
            <QuickSidebarSessionItem session={session} />
          </CommandItem>
        ))}
      </div>
    </div>
  );
}
