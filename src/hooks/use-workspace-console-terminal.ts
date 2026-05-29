import { useCallback, useEffect, useRef, type RefObject } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { Terminal } from "@xterm/xterm";
import {
  shouldResizeWorkspaceConsoleTerminal,
  type WorkspaceConsoleTerminalSize,
} from "@/lib/workspace-console";
import {
  onWorkspaceConsoleEvent,
  resizeWorkspaceConsoleSession,
  writeWorkspaceConsoleInput,
} from "@/services/workspace-console";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";
import "@xterm/xterm/css/xterm.css";

interface UseWorkspaceConsoleTerminalInput {
  active: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  session: WorkspaceConsoleSession;
}

export const useWorkspaceConsoleTerminal = ({
  active,
  containerRef,
  session,
}: UseWorkspaceConsoleTerminalInput): void => {
  const activeRef = useRef(active);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const fitTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const lastSizeRef = useRef<WorkspaceConsoleTerminalSize | null>(null);
  const terminalRef = useRef<Terminal | null>(null);

  const clearPendingFit = useCallback(() => {
    if (!fitTimerRef.current) return;
    window.clearTimeout(fitTimerRef.current);
    fitTimerRef.current = null;
  }, []);

  const fitAndResize = useCallback(() => {
    const container = containerRef.current;
    const fitAddon = fitAddonRef.current;
    const terminal = terminalRef.current;
    if (!activeRef.current || !container || !fitAddon || !terminal) return;
    if (container.clientHeight <= 0 || container.clientWidth <= 0) return;

    try {
      const buffer = terminal.buffer.active;
      const wasAtBottom = buffer.viewportY >= buffer.baseY;
      const previousViewportY = buffer.viewportY;
      fitAddon.fit();
      if (wasAtBottom) terminal.scrollToBottom();
      else terminal.scrollToLine(Math.min(previousViewportY, terminal.buffer.active.baseY));

      const nextSize = { cols: terminal.cols, rows: terminal.rows };
      if (!shouldResizeWorkspaceConsoleTerminal(lastSizeRef.current, nextSize)) return;
      lastSizeRef.current = nextSize;
      void resizeWorkspaceConsoleSession(session.sessionId, nextSize.cols, nextSize.rows).catch((error) => console.error("Workspace console terminal resize failed", { error, sessionId: session.sessionId, size: nextSize }));
    } catch (error) {
      console.error("Workspace console terminal fit failed", {
        error,
        sessionId: session.sessionId,
      });
    }
  }, [containerRef, session.sessionId]);

  const scheduleFit = useCallback(() => {
    if (!activeRef.current) return;
    clearPendingFit();
    fitTimerRef.current = window.setTimeout(fitAndResize, 75);
  }, [clearPendingFit, fitAndResize]);

  useEffect(() => {
    activeRef.current = active;
    if (!active) return;
    terminalRef.current?.focus();
    scheduleFit();
  }, [active, scheduleFit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let disposed = false;

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.15,
      scrollback: 5000,
      theme: {
        background: "#09090b",
        foreground: "#f4f4f5",
        selectionBackground: "#3f3f46",
      },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new SearchAddon());
    terminal.open(container);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const dataDisposable = terminal.onData((data) => {
      void writeWorkspaceConsoleInput(session.sessionId, data).catch((error) => console.error("Workspace console input write failed", { error, sessionId: session.sessionId }));
    });
    const unsubscribe = onWorkspaceConsoleEvent((event) => {
      if ("sessionId" in event && event.sessionId !== session.sessionId) return;
      if (event.type === "data") terminal.write(event.data);
      if (event.type === "exit") {
        terminal.writeln(`\r\n[process exited with code ${event.exitCode}]`);
      }
      if (event.type === "error") terminal.writeln(`[terminal error: ${event.error}]`);
    });
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleFit);
    resizeObserver?.observe(container);

    const animationFrame = window.requestAnimationFrame(fitAndResize);
    void document.fonts?.ready.then(() => {
      if (!disposed) fitAndResize();
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      clearPendingFit();
      resizeObserver?.disconnect();
      unsubscribe();
      dataDisposable.dispose();
      terminal.dispose();
      fitAddonRef.current = null;
      terminalRef.current = null;
      lastSizeRef.current = null;
    };
  }, [clearPendingFit, containerRef, fitAndResize, scheduleFit, session.sessionId]);
};
