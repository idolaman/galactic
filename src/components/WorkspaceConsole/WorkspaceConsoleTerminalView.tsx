import { useRef } from "react";
import { useWorkspaceConsoleTerminal } from "@/hooks/use-workspace-console-terminal";
import { cn } from "@/lib/utils";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";

interface WorkspaceConsoleTerminalViewProps {
  active: boolean;
  session: WorkspaceConsoleSession;
}

export const WorkspaceConsoleTerminalView = ({
  active,
  session,
}: WorkspaceConsoleTerminalViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useWorkspaceConsoleTerminal({ active, containerRef, session });

  return (
    <div
      ref={containerRef}
      className={cn(
        "workspace-console-terminal h-full w-full overflow-hidden bg-zinc-950",
        !active && "hidden",
      )}
    />
  );
};
