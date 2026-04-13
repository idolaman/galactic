import { ChevronDown, Globe, Waypoints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WorkspaceIsolationCopyButton } from "@/components/WorkspaceIsolationCopyButton";
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
              className="group mb-1 h-auto w-full justify-start rounded-md p-2 transition-all hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex w-full items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Waypoints className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium text-foreground/90 transition-colors group-hover:text-foreground">
                    Routed Services
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="h-5 border-none bg-primary/10 px-1.5 text-[10px] text-primary transition-colors group-hover:bg-primary/20"
                  >
                    {stack.services.length} active
                  </Badge>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:text-muted-foreground",
                    open && "rotate-180 text-foreground"
                  )}
                />
              </div>
            </Button>
          </CollapsibleTrigger>

          {previewRoutes.length > 0 ? (
            <div className="mt-1.5 grid gap-1.5 px-2 pb-1.5">
              {previewRoutes.map((route) => (
                <div
                  key={route}
                  className="group flex w-full items-center justify-between gap-3 rounded-lg border border-black/[0.04] bg-black/[0.02] px-2.5 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:border-black/10 hover:bg-background hover:shadow-sm dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-background/80"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-black/5 text-muted-foreground shadow-sm transition-colors group-hover:bg-primary/10 group-hover:text-primary dark:bg-white/10">
                      <Globe className="h-3 w-3" />
                    </div>
                    <a
                      href={`http://${route}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-mono text-[11px] font-medium tracking-tight text-muted-foreground transition-colors hover:text-primary hover:underline group-hover:text-foreground"
                      title={route}
                    >
                      {route}
                    </a>
                  </div>
                  <div className="shrink-0 -mr-0.5 opacity-100 transition-opacity sm:opacity-40 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
                    <WorkspaceIsolationCopyButton
                      text={route}
                      label="service domain"
                      successMessage="Domain copied"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <CollapsibleContent>
          <div className="border-t border-border/40 bg-background/30 p-3 pt-3 flex flex-col gap-4">
            <WorkspaceIsolationAdvancedRouting stack={stack} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
