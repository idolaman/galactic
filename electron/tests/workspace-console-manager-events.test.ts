import assert from "node:assert/strict";
import test from "node:test";
import { WorkspaceConsoleSessionManager } from "../workspace-console/manager.js";
import type {
  WorkspaceConsolePty,
  WorkspaceConsolePtySpawnOptions,
} from "../workspace-console/pty-adapter.js";
import type { WorkspaceConsoleEvent } from "../workspace-console/types.js";

const disposable = { dispose: () => undefined };

class SilentPty implements WorkspaceConsolePty {
  kill = () => undefined;
  onData = () => disposable;
  onExit = () => disposable;
  resize = () => undefined;
  write = () => undefined;
}

test("WorkspaceConsoleSessionManager continues when an event listener throws", () => {
  const manager = new WorkspaceConsoleSessionManager({
    spawn: (_options: WorkspaceConsolePtySpawnOptions) => new SilentPty(),
  });
  const events: WorkspaceConsoleEvent[] = [];
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    manager.onEvent(() => {
      throw new Error("listener failed");
    });
    manager.onEvent((event) => events.push(event));

    assert.equal(manager.createSession({ workspacePath: "/tmp/app" }).success, true);
    assert.deepEqual(events.map((event) => event.type), ["created"]);
  } finally {
    console.error = originalConsoleError;
  }
});
