import { useEffect, useRef } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { Terminal } from "@xterm/xterm";
import { cn } from "@/lib/utils";
import {
  onWorkspaceConsoleEvent,
  resizeWorkspaceConsoleSession,
  writeWorkspaceConsoleInput,
} from "@/services/workspace-console";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";
import "@xterm/xterm/css/xterm.css";

interface WorkspaceConsoleTerminalViewProps {
  active: boolean;
  session: WorkspaceConsoleSession;
}

export const WorkspaceConsoleTerminalView = ({
  active,
  session,
}: WorkspaceConsoleTerminalViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 13,
      theme: { background: "#050505", foreground: "#f4f4f5" },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new SearchAddon());
    terminal.open(container);

    const fitAndResize = () => {
      try {
        fitAddon.fit();
        if (terminal.cols > 0 && terminal.rows > 0) {
          void resizeWorkspaceConsoleSession(
            session.sessionId,
            terminal.cols,
            terminal.rows,
          );
        }
      } catch {
        return;
      }
    };

    const dataDisposable = terminal.onData((data) => {
      void writeWorkspaceConsoleInput(session.sessionId, data);
    });
    const unsubscribe = onWorkspaceConsoleEvent((event) => {
      if ("sessionId" in event && event.sessionId !== session.sessionId) return;
      if (event.type === "data") terminal.write(event.data);
      if (event.type === "exit") {
        terminal.writeln("");
        terminal.writeln(`[process exited with code ${event.exitCode}]`);
      }
      if (event.type === "error") terminal.writeln(`[terminal error: ${event.error}]`);
    });
    const resizeObserver = new ResizeObserver(fitAndResize);
    resizeObserver.observe(container);
    const animationFrame = window.requestAnimationFrame(fitAndResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      unsubscribe();
      dataDisposable.dispose();
      terminal.dispose();
    };
  }, [session.sessionId]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full overflow-hidden p-2", !active && "hidden")}
    />
  );
};
