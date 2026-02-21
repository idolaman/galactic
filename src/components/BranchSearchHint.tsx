import { Info, GitBranch } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BranchSearchHint() {
  return (
    <div className="flex items-center justify-between px-1.5 py-0.5 text-xs text-muted-foreground/70">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <GitBranch className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Including remote branches</span>
      </div>

      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger
            type="button"
            className="flex items-center gap-1.5 flex-shrink-0 cursor-help hover:text-foreground transition-colors ml-2 outline-none group"
          >
            <Info className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground" />
            <span>Details</span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="end"
            className="max-w-[300px] space-y-3 p-3.5 text-xs z-[100] shadow-xl border-primary/10"
          >
            <p className="text-foreground leading-relaxed font-medium">
              Galactic runs <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px] border border-border/50">git fetch --all --prune</code> to discover remote branches.
            </p>
            <div className="space-y-1.5 text-muted-foreground mt-2 leading-relaxed">
              <p>If Git auth is not configured, your OS may show a credentials popup.</p>
              <p>If auth fails, we automatically fall back to showing your local branches.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
