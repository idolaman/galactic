import type { RefObject } from "react";
import { Rocket, Search } from "lucide-react";
import { CommandInput } from "@/components/ui/command";

export interface QuickSidebarSearchHeaderProps {
  inputRef: RefObject<HTMLInputElement | null>;
  search: string;
  onSearchChange: (value: string) => void;
}

export function QuickSidebarSearchHeader({
  inputRef,
  search,
  onSearchChange,
}: QuickSidebarSearchHeaderProps) {
  return (
    <div className="shrink-0 space-y-3 border-b border-white/5 bg-[#050510]/50 px-5 pb-3 pt-7 backdrop-blur-sm">
      <div className="group relative">
        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-600/10 opacity-0 blur transition duration-500 group-focus-within:opacity-100" />
        <div className="relative flex items-center rounded-lg border border-white/5 bg-white/5 shadow-sm transition-all group-focus-within:border-white/10 group-focus-within:bg-[#0A0A15]">
          <Search className="ml-3 h-3.5 w-3.5 text-white/30 transition-colors group-focus-within:text-white/50" />
          <CommandInput
            placeholder="Search projects & workspaces..."
            value={search}
            onValueChange={onSearchChange}
            ref={inputRef}
            autoFocus
            hideIcon
            wrapperClassName="h-9 flex-1 border-none bg-transparent px-0"
            className="h-full border-0 bg-transparent px-3 text-sm font-medium text-white placeholder:text-white/20 focus:ring-0"
          />
          <div className="mr-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 opacity-50">
              <Rocket className="h-3 w-3 text-indigo-400" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-indigo-300">
                Galactic
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
