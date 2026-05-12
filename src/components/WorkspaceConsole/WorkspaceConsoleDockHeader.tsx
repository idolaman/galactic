import {
  EyeOff,
  Maximize2,
  Minimize2,
  Plus,
  SquareTerminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";

interface WorkspaceConsoleDockHeaderProps {
  expanded: boolean;
}

export const WorkspaceConsoleDockHeader = ({
  expanded,
}: WorkspaceConsoleDockHeaderProps) => {
  const consoleState = useWorkspaceConsole();
  const SizeIcon = expanded ? Minimize2 : Maximize2;
  const sizeLabel = expanded ? "Dock console" : "Expand console";
  const handleToggleSize = expanded
    ? consoleState.collapseConsole
    : consoleState.expandConsole;

  return (
    <div className="flex min-h-12 items-center justify-between gap-3 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <SquareTerminal className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">Workspace Console</div>
          <div className="truncate text-xs text-muted-foreground">
            {consoleState.activeSession?.workspaceLabel ?? "No active workspace"}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!consoleState.canCreateShell}
          onClick={() => void consoleState.createShell()}
        >
          <Plus className="h-4 w-4" />
          New Shell
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleToggleSize}>
              <SizeIcon className="h-4 w-4" />
              <span className="sr-only">{sizeLabel}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sizeLabel}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={consoleState.hideDock}>
              <EyeOff className="h-4 w-4" />
              <span className="sr-only">Hide console</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Hide console</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
