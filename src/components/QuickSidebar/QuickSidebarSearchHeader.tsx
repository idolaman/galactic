import type { RefObject } from "react";
import { Search } from "lucide-react";
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
    <div className="shrink-0 border-b bg-card px-3 pb-3 pt-4">
      <div className="group relative">
        <div className="relative flex items-center rounded-md border bg-background transition-colors group-focus-within:border-primary/60 group-focus-within:ring-2 group-focus-within:ring-primary/15">
          <Search className="ml-3 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <CommandInput
            placeholder="Search projects and workspaces..."
            value={search}
            onValueChange={onSearchChange}
            ref={inputRef}
            autoFocus
            hideIcon
            wrapperClassName="h-9 flex-1 border-none bg-transparent px-0"
            className="h-full border-0 bg-transparent px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:ring-0"
          />
          <div className="mr-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            esc
          </div>
        </div>
      </div>
    </div>
  );
}
