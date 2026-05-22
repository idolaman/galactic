# Workspace Console MVP

Status: product and engineering handoff draft  
Date: 2026-05-11  
First implementation milestone: Terminal First

## Summary

Workspace Console is Galactic's workspace-scoped terminal surface. It lets a developer open shells inside a selected repository root or branch worktree, keep those shells tied to the correct workspace, and later run Project Services and safe launch configurations without leaving Galactic.

The first engineering milestone is Terminal First: embedded shell sessions in a bottom dock with tab lifecycle, workspace cwd, and basic terminal controls. The full MVP also includes Start Services and Run Config from `.vscode/launch.json`, but those should be implemented after the terminal foundation is stable.

The name is **Workspace Console**. Avoid "debug in Galactic" until Galactic has real Debug Adapter Protocol support. In the MVP, Galactic can run compatible launch configurations in the console and should send debugger-only configurations to Cursor or VS Code.

## Product Goal

Primary user:
- Developers running multiple branch workspaces, services, or AI coding sessions side by side.

User goal:
- Start the right shell, services, or run configuration in the right workspace without manual `cd`, port setup, or editor switching.

Why this matters:
- Galactic already solves branch and Project Services setup. Workspace Console closes the loop by making the command-running surface workspace-aware too, reducing port conflicts, environment drift, and uncertainty about which branch a command belongs to.

## Approved Scope

Full MVP includes:
- A bottom-docked Workspace Console available from project/workspace cards.
- Fresh shell tabs scoped to a specific workspace path.
- Session tabs with visible status, title, close, kill, and New Shell.
- Hide preserves sessions. Closing a terminal tab kills that session after confirmation if the process is still running.
- Start Services creates one terminal tab per configured Project Services service and starts each command in the right service folder with the right environment.
- Run Config reads `.vscode/launch.json`, shows compatible configurations, runs only configs that can be faithfully represented as terminal commands, and routes debugger-only configs to Cursor or VS Code.
- Error, empty, unsupported, and degraded states that explain what the user can do next.

First milestone includes only:
- Bottom dock.
- New Shell.
- Embedded terminal sessions.
- Session list and tab lifecycle.
- Basic terminal input, output, resize, reconnect-safe renderer behavior, close, and kill.

Out of scope for MVP:
- Real DAP debugging inside Galactic.
- Persisting terminal sessions across app restarts.
- Multiplexed split panes inside the console.
- Remote hosts, containers, SSH, or cloud execution.
- Running arbitrary launch config types by best effort when semantics are unclear.

## Superset Lessons To Preserve

Superset's terminal implementation has the right architectural shape:
- The host process owns PTY sessions; React views attach to sessions by id.
- Terminal view lifetime is separate from process lifetime.
- Renderer panes should not paste startup commands into a newly opened terminal.
- Automated commands should be delivered host-side through a session creation API with `initialCommand`.
- Output should be buffered until the renderer attaches.
- Closing the UI and killing the process must be separate concepts unless the product intentionally says otherwise.

Galactic should borrow the session contract, not Superset's full pane/split workspace model. Galactic's current app does not need a general IDE pane system for the first MVP.

## UX Behavior

Entry points:
- Add a Console button beside each workspace card's Open button.
- Opening Console for a workspace opens the bottom dock and either focuses an existing session for that workspace or creates a fresh shell if none exists.
- The dock remains app-level within the main project view, not embedded inside a workspace card.

Dock layout:
- Header: "Workspace Console", active workspace label, session count/status, New Shell, future Run Config, future Start Services, hide.
- Tab row: one tab per session. Each tab shows a derived title, status indicator, and close affordance.
- Body: active xterm terminal.
- Empty state: if no session is open for the selected workspace, show actions for New Shell and, later, Start Services/Run Config.

Terminal tab behavior:
- New Shell opens a shell in the selected workspace root by default.
- Closing a running tab asks for confirmation because it kills the underlying process.
- Closing an exited tab removes it without confirmation.
- Hiding the dock does not kill sessions.
- Reopening the dock restores visible sessions that are still in memory.
- Kill Process is explicit and destructive.

User-facing copy:
- Use "Workspace Console" for the feature.
- Use "New Shell" for a fresh terminal.
- Use "Start Services" for Project Services command launching.
- Use "Run Config" for `.vscode/launch.json`.
- Use "Open in Cursor" or "Open in VS Code" for debugger-only configs.
- Do not use "Debug in Galactic" in MVP copy.

## Terminal First Engineering Contract

Session ownership:
- Electron main owns PTY sessions.
- Renderer owns xterm views and user interaction.
- IPC connects renderer actions to the main-process session manager.
- Sessions are keyed by generated `sessionId`.
- Sessions include `workspacePath`, `workspaceLabel`, `cwd`, `createdAt`, `status`, `title`, and optional exit metadata.
- Sessions are in-memory only for the first milestone.

Minimum IPC surface:
- `workspace-console/create-session`
- `workspace-console/list-sessions`
- `workspace-console/write-input`
- `workspace-console/resize`
- `workspace-console/kill-session`
- `workspace-console/event`

Minimum renderer service API:
- `createWorkspaceConsoleSession(input)`
- `listWorkspaceConsoleSessions()`
- `writeWorkspaceConsoleInput(sessionId, data)`
- `resizeWorkspaceConsoleSession(sessionId, cols, rows)`
- `killWorkspaceConsoleSession(sessionId)`
- `onWorkspaceConsoleEvent(callback)`

Session event types:
- `created`: a session was created.
- `data`: PTY output for a session.
- `title`: terminal title changed, if detectable.
- `exit`: process exited with code/signal.
- `error`: session failed or stream error occurred.
- `removed`: session was killed/removed.

Environment and cwd:
- Default cwd is the workspace root path.
- Future service sessions use the service folder as cwd.
- Main process resolves shell and cwd. Renderer must not build shell commands.
- Main process validates that cwd is inside or equal to the workspace path unless an explicit future feature allows otherwise.
- Terminal sessions should inherit a clean process environment plus Galactic workspace/service variables where appropriate.

Dependencies:
- Use `node-pty` for PTY sessions.
- Use `@xterm/xterm` for terminal rendering.
- Use `@xterm/addon-fit` for sizing.
- Add `@electron/rebuild` or an equivalent native module rebuild step because Electron native modules must be rebuilt for Electron's ABI.

## Full MVP: Start Services

Start Services depends on Project Services being configured for the project and active for the workspace.

Behavior:
- Show Start Services when the selected workspace has an active Project Services stack.
- For each service, open or reuse a service session tab.
- Session cwd is `workspacePath/service.relativePath`, with `.` mapping to workspace root.
- Session title should use the service name.
- Inject service environment:
  - `HOST=127.0.0.1`
  - `PORT=<assigned service port>`
  - connection variables from the Project Services topology, such as `API_URL`.
- Run the configured command after shell readiness. If no command is configured yet, use the documented fallback command from the current UI only as a hint, not as an automatic command.

Command configuration gap:
- Current Project Services model stores service folders, ports, slugs, and connections, but not explicit run commands.
- The MVP needs a command source before Start Services can be automatic.
- Preferred command source: add a per-service `runCommand` field to the Project Services topology UI and project config export/import.
- Fallback if `runCommand` is missing: open service shells and display the suggested command, but do not auto-run.

Failure states:
- No Project Services configured: show setup action.
- Project Services not active for workspace: show Activate Project Services.
- Missing service folder: show service-specific error and do not create that session.
- Missing run command: open shell or mark service as Needs command.
- Port unavailable or proxy unavailable: show Project Services status and keep terminal output visible.

## Full MVP: Run Config

Run Config reads `.vscode/launch.json` from the selected workspace.

MVP principle:
- Only run configurations that Galactic can faithfully translate to a normal terminal command.
- Debugger-specific behavior belongs in Cursor or VS Code until Galactic has DAP support.

Config classification:
- `Run in Console`: safe to run as a command without claiming debug semantics.
- `Open in Editor`: debugger config or unsupported behavior that should be handed to Cursor/VS Code.
- `Unsupported`: malformed, missing required fields, or uses fields Galactic cannot interpret safely.

Run in Console examples:
- A config with an explicit command-like runtime executable and args that can be represented as a terminal command.
- A task-backed flow where the command can be resolved without VS Code debugger semantics.

Open in Editor examples:
- Breakpoint debugging.
- Attach configs.
- Debug adapter specific config types.
- Configs with behavior that depends on VS Code debug adapter variable expansion or lifecycle hooks.

UI behavior:
- Run Config button opens a menu grouped by classification.
- Compatible configs show "Run in Console".
- Debugger-only configs show "Open in Cursor" or "Open in VS Code".
- Unsupported configs are visible but disabled with a reason.

Execution behavior:
- Create a new Workspace Console session with `initialCommand`.
- Do not paste commands from the renderer.
- Use host-side command delivery after shell readiness.
- Display the source config name in the tab title.

## State Matrix

| State | What the user sees | Expected outcome |
| --- | --- | --- |
| No dock open | Console button on workspace cards | User can open Workspace Console for the desired workspace. |
| Empty console | Empty state with New Shell | User can start a workspace-scoped shell. |
| Creating session | Pending tab/status | User sees that Galactic is starting the shell. |
| Session running | Terminal tab with output/input | User can run commands in the correct workspace. |
| Dock hidden | Main UI without dock, sessions preserved | User can reopen without losing running commands. |
| Running tab close | Confirmation | User understands closing kills the process. |
| Exited tab close | No confirmation | Exited session is removed. |
| PTY spawn failure | Error state in tab/toast | User sees why the shell did not start. |
| Project Services inactive | Start Services disabled with activation action | User can activate services first. |
| Missing service command | Service marked Needs command | User is not surprised by no-op auto start. |
| launch.json missing | Run Config empty state | User understands no launch configs exist. |
| launch config unsupported | Disabled item with reason | User can open in editor or edit config. |

## Acceptance Criteria

Terminal First:
- Console opens from repository root and branch workspace cards.
- New Shell starts in the selected workspace path.
- Terminal input and output work for normal interactive shells.
- Resize updates PTY dimensions.
- Multiple terminal tabs can run for the same workspace.
- Hiding the dock preserves active sessions.
- Closing a running tab requires confirmation and kills that process.
- Closing an exited tab removes it without confirmation.
- Killing a session removes renderer state and main-process PTY state.
- The app handles PTY spawn errors without crashing.

Start Services:
- Start Services is available only when a workspace has active Project Services.
- Service tabs use correct cwd and environment.
- Missing command and missing folder are handled per service.
- Existing service sessions are not duplicated accidentally.

Run Config:
- `.vscode/launch.json` is parsed without crashing on malformed JSON.
- Each config is classified as Run in Console, Open in Editor, or Unsupported.
- Run in Console creates a terminal session with host-side `initialCommand`.
- Debugger-only configs are not misrepresented as native Galactic debugging.

## Instrumentation

Track:
- `WorkspaceConsole.opened`
- `WorkspaceConsole.sessionCreated`
- `WorkspaceConsole.sessionKilled`
- `WorkspaceConsole.sessionExited`
- `WorkspaceConsole.hidden`
- `WorkspaceConsole.startServicesClicked`
- `WorkspaceConsole.runConfigClicked`
- `WorkspaceConsole.runConfigClassified`
- `WorkspaceConsole.error`

Useful properties:
- `targetKind`: repository root or workspace.
- `sessionKind`: shell, service, run-config.
- `serviceCount`.
- `configClassification`.
- `success`.
- `errorKind`.

Why this matters:
- Product needs to know whether users open fresh shells only, start services from Galactic, or rely on launch configs.
- Error classification will show whether native PTY setup, missing commands, or unsupported launch configs block adoption.

## Open Risks

- `node-pty` is a native module and may require build/rebuild work in Electron packaging.
- Windows support is theoretically possible but Galactic currently positions macOS first; avoid over-designing Windows behavior in the first milestone.
- Project Services does not yet store run commands, so Start Services needs a schema/UI addition before it can be automatic.
- launch.json semantics are broad and debugger-specific. The MVP must stay conservative.
- Long-running PTY sessions need cleanup on app quit and workspace deletion.
- Terminal Auto-Env currently supports zsh. Workspace Console can inject env directly, but this must not conflict with the existing zsh hook behavior.

## Implementation Notes For Future Planning

Recommended order:
1. Write or keep this document updated.
2. Add dependencies and native rebuild support.
3. Add main-process session manager with fake-PTY tests.
4. Add IPC/preload/types/service wrappers.
5. Add bottom dock and xterm renderer.
6. Wire workspace card Console entry points.
7. Verify Terminal First manually and with tests.
8. Plan service run commands and launch.json support as separate follow-up slices.

Do not let implementation decide alone:
- Whether to claim debugging support.
- Which launch config types are safe.
- Whether missing service run commands should auto-run guesses.
- Whether sessions persist across app restarts.

Defaults already chosen:
- Name: Workspace Console.
- Placement: bottom dock.
- First milestone: Terminal First.
- Hidden dock preserves sessions.
- Closing a terminal tab kills that session after confirmation if running.
- Run Config is run-only, not debugger support.
