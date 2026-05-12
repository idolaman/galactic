import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { WorkspaceConsoleSessionManager } from "../workspace-console/manager.js";
import type {
  WorkspaceConsolePty,
  WorkspaceConsolePtyAdapter,
  WorkspaceConsolePtySpawnOptions,
} from "../workspace-console/pty-adapter.js";
import type { WorkspaceConsoleEvent } from "../workspace-console/types.js";

class FakePty implements WorkspaceConsolePty {
  killed = false;
  resized: Array<[number, number]> = [];
  written: string[] = [];
  private readonly dataListeners = new Set<(data: string) => void>();
  private readonly errorListeners = new Set<(error: Error) => void>();
  private readonly exitListeners = new Set<(event: { exitCode: number; signal?: number }) => void>();

  kill = () => {
    this.killed = true;
  };
  onData = (listener: (data: string) => void) => this.addListener(this.dataListeners, listener);
  onError = (listener: (error: Error) => void) => this.addListener(this.errorListeners, listener);
  onExit = (listener: (event: { exitCode: number; signal?: number }) => void) =>
    this.addListener(this.exitListeners, listener);
  resize = (cols: number, rows: number) => {
    this.resized.push([cols, rows]);
  };
  write = (data: string) => {
    this.written.push(data);
  };

  emitData(data: string) {
    this.dataListeners.forEach((listener) => listener(data));
  }
  emitError(error: Error) {
    this.errorListeners.forEach((listener) => listener(error));
  }
  emitExit(event: { exitCode: number; signal?: number }) {
    this.exitListeners.forEach((listener) => listener(event));
  }
  private addListener<T>(listeners: Set<(value: T) => void>, listener: (value: T) => void) {
    listeners.add(listener);
    return { dispose: () => listeners.delete(listener) };
  }
}

class FakePtyAdapter implements WorkspaceConsolePtyAdapter {
  ptys: FakePty[] = [];
  spawnOptions: WorkspaceConsolePtySpawnOptions[] = [];
  spawn = (options: WorkspaceConsolePtySpawnOptions): WorkspaceConsolePty => {
    const pty = new FakePty();
    this.spawnOptions.push(options);
    this.ptys.push(pty);
    return pty;
  };
}

test("WorkspaceConsoleSessionManager rejects cwd outside workspace", () => {
  const manager = new WorkspaceConsoleSessionManager(new FakePtyAdapter());
  const result = manager.createSession({
    cwd: "/tmp/other",
    workspacePath: "/tmp/workspace",
  });

  assert.deepEqual(result, {
    success: false,
    error: "Terminal cwd must stay inside the workspace.",
  });
});

test("WorkspaceConsoleSessionManager emits PTY lifecycle events", () => {
  const adapter = new FakePtyAdapter();
  const manager = new WorkspaceConsoleSessionManager(adapter);
  const events: WorkspaceConsoleEvent[] = [];
  manager.onEvent((event) => events.push(event));

  const result = manager.createSession({ workspaceLabel: "API", workspacePath: "/tmp/api" });
  assert.equal(result.success, true);
  assert.ok(result.value?.sessionId);
  const { sessionId } = result.value;
  adapter.ptys[0].emitData("ready\x1b]0;npm dev\x07");
  adapter.ptys[0].emitExit({ exitCode: 0 });
  adapter.ptys[0].emitError(new Error("pty failed"));
  const removeResult = manager.killSession(sessionId);

  assert.equal(removeResult.success, true);
  assert.deepEqual(events.map((event) => event.type), [
    "created",
    "data",
    "title",
    "exit",
    "error",
    "removed",
  ]);
  assert.equal(events[2].type === "title" ? events[2].title : "", "npm dev");
});

test("WorkspaceConsoleSessionManager routes write resize and dispose to PTY", () => {
  const adapter = new FakePtyAdapter();
  const manager = new WorkspaceConsoleSessionManager(adapter);
  const result = manager.createSession({ workspacePath: "/tmp/app" });
  assert.equal(result.success, true);
  assert.ok(result.value?.sessionId);
  const { sessionId } = result.value;

  assert.deepEqual(manager.writeInput(sessionId, "pwd\r"), { success: true });
  assert.deepEqual(manager.resize(sessionId, 120, 40), { success: true });
  manager.disposeAll();

  assert.deepEqual(adapter.ptys[0].written, ["pwd\r"]);
  assert.deepEqual(adapter.ptys[0].resized, [[120, 40]]);
  assert.notEqual(adapter.spawnOptions[0].env, process.env);
  assert.equal(adapter.ptys[0].killed, true);
  assert.deepEqual(manager.listSessions(), []);
});

test("WorkspaceConsoleSessionManager reports PTY spawn failures", () => {
  const manager = new WorkspaceConsoleSessionManager({
    spawn: () => {
      throw new Error("shell missing");
    },
  });

  assert.deepEqual(manager.createSession({ workspacePath: "/tmp/app" }), {
    success: false,
    error: "shell missing",
  });
});
