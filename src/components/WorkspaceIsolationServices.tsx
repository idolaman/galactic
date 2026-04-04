import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WorkspaceIsolationAdvancedRouting } from "@/components/WorkspaceIsolationAdvancedRouting";
import { getWorkspaceIsolationHostnames } from "@/lib/workspace-isolation";
import { cn } from "@/lib/utils";
import type { ServiceStackEnvironment } from "@/types/service-stack";

interface WorkspaceIsolationServicesProps {
  stack: ServiceStackEnvironment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceIsolationServices = ({
  stack,
  open,
  onOpenChange,
}: WorkspaceIsolationServicesProps) => {
  const previewHostnames = getWorkspaceIsolationHostnames(stack);

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
                  {previewHostnames.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-muted-foreground/80">
                      {previewHostnames.map((hostname) => (
                        <span key={hostname} className="truncate max-w-[180px] sm:max-w-[250px]">
                          {hostname}
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
          <div className="border-t border-border/40 bg-background/30 p-3 pt-3">
            <WorkspaceIsolationAdvancedRouting stack={stack} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
