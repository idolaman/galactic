import { Keyboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface QuickLauncherHintProps {
  className?: string;
}

export function QuickLauncherHint({ className }: QuickLauncherHintProps) {
  return (
    <NavLink
      to="/settings#global-hotkey"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-left text-white shadow-sm transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0",
        className
      )}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-200 ring-1 ring-white/10">
        <Keyboard className="h-3.5 w-3.5" />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold leading-tight text-white">Quick Launcher</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-1.5 py-[2px] text-[10px] font-semibold text-white/90 shadow-sm">
            ⌘⇧G
          </span>
        </div>
        <span className="text-[10px] leading-tight text-white/65">Configure in Settings</span>
      </div>
    </NavLink>
  );
}
