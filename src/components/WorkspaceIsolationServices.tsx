import { ChevronDown, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WorkspaceIsolationAdvancedRouting } from "@/components/WorkspaceIsolationAdvancedRouting";
import { getWorkspaceIsolationPreviewRoutes } from "@/lib/workspace-isolation";
import { cn } from "@/lib/utils";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

interface WorkspaceIsolationServicesProps {
  stack: WorkspaceIsolationStack;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceIsolationServices = ({
  stack,
  open,
  onOpenChange,
}: WorkspaceIsolationServicesProps) => {
  const previewRoutes = getWorkspaceIsolationPreviewRoutes(stack);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="overflow-hidden">
        <div className="p-3">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex w-full items-center justify-between gap-3 text-left">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Routed Services</span>
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{stack.services.length}</Badge>
                  </div>
                  {previewRoutes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-muted-foreground/80">
                      {previewRoutes.map((route) => (
                        <span key={route} className="truncate max-w-[180px] sm:max-w-[250px]">
                          {route}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </div>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="border-t border-border/40 bg-background/30 p-3 pt-3 flex flex-col gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">How to use this</h4>
              </div>
              <div className="rounded-md bg-muted/60 p-3 font-mono text-[11px] text-muted-foreground leading-relaxed">
                <p className="text-foreground/80 mb-1"># Just run your service normally:</p>
                <div className="flex flex-col gap-1.5 opacity-80">
                  {stack.services.map((service, index) => (
                    <span key={service.id}>
                      cd {service.relativePath === "." ? stack.workspaceRootPath : service.relativePath} && npm run dev
                    </span>
                  ))}
                </div>
                <p className="text-foreground/80 mt-3 mb-1"># Galactic will auto-inject the correct PORT and dependencies into your zsh variables invisibly.</p>
              </div>
            </div>
            <WorkspaceIsolationAdvancedRouting stack={stack} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
