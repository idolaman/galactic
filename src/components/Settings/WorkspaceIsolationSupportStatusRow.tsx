import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkspaceIsolationSupportStatusRowProps {
  badgeLabel: string;
  badgeToneClassName?: string;
  children?: ReactNode;
  description: string;
  labelFor?: string;
  title: string;
  tooltip: string;
}

export function WorkspaceIsolationSupportStatusRow({
  badgeLabel,
  badgeToneClassName,
  children,
  description,
  labelFor,
  title,
  tooltip,
}: WorkspaceIsolationSupportStatusRowProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 rounded-lg border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label htmlFor={labelFor} className="text-sm font-medium">{title}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-4 w-4 rounded-full text-muted-foreground hover:text-primary" aria-label={`${title} help`}>
                  <HelpCircle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                {tooltip}
              </TooltipContent>
            </Tooltip>
            <Badge
              variant="secondary"
              className={badgeToneClassName}
            >
              {badgeLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </TooltipProvider>
  );
}
