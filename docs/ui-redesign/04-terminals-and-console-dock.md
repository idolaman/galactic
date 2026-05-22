# Step 4: Terminals And Console Dock

## Goal

Make the terminal feature feel like a first-class developer workbench surface, not an attached debug panel. The console should be calm, dense, reliable, and clearly connected to the workspace it is controlling.

## Scope

Update:

- `src/components/WorkspaceConsole/*`
- `src/lib/workspace-console.ts`
- `src/hooks/use-workspace-console-*`
- `src/services/workspace-console.ts`
- terminal-related styling in `src/index.css` only if shared tokens cannot cover it

Do not redesign Project Services dialogs in this step. Keep the focus on terminal sessions, dock behavior, tab management, rendering quality, and terminal-specific states.

## Design Changes

### Dock Shell

Turn the console dock into a compact workbench panel:

- header: workspace name, active session status, concise dock/expand/hide controls
- tab strip: sessions as dense tabs with status, title, cwd hint, and close affordance
- body: terminal surface fills the available space with no decorative padding that harms xterm sizing
- restore bar: compact and informative, not a large alert-style banner

Use the same app tokens and border rhythm as the project/workspace screens. Avoid glowing shadows, large black slabs outside the terminal canvas, and oversized labels.

### Session Management

Make multiple terminal sessions easy to understand:

- show `starting`, `running`, `exited`, and `error` states inline
- keep session title and workspace label visible without repeating long paths everywhere
- allow creating a new shell from the dock header when a workspace context exists
- preserve current close confirmation behavior for live sessions
- make closed/exited sessions readable before removal

Borrow the useful Superset pattern of a session selector/background-session model, but keep Galactic simpler: tabs first, optional session menu only if tabs become crowded.

### Terminal Surface

Improve the xterm experience:

- remove wrapper padding that causes fractional sizing or clipped glyphs
- use a stable terminal theme aligned with Galactic tokens
- debounce resize/fit work and avoid backend resize calls when cols/rows did not change
- preserve scroll position across resize when possible
- wait for font/layout readiness before final fit where practical
- surface shell startup failures inside the dock with actionable copy

Superset references to consider:

- terminal runtime registry for persistent session mounting
- deferred addon loading and resize debounce
- terminal rendering divergence notes around font loading, fit behavior, and scroll preservation
- terminal session dropdown/background-session affordances

### Actions And Trust Cues

Expose power-user controls without clutter:

- copy cwd or workspace path from a small menu, not from the default header
- show open-in-editor/reveal actions only when they apply to a selected path or link
- make terminal links feel intentional with hover/click hints
- keep error messages precise: shell missing, helper permissions, cwd invalid, or desktop bridge unavailable

## Acceptance Criteria

- Console dock visually belongs to the same app shell as Projects and Workspaces.
- Opening a workspace console clearly shows which workspace and session are active.
- Terminal tabs remain usable with many sessions and long titles.
- Expanded mode does not hide or distort the terminal canvas.
- Restore bar is compact and preserves context.
- Terminal startup, exit, and error states are visible and understandable.
- Existing shell create, write, resize, focus, close, hide, restore, and expand behavior still works.

## Verification

Run:

```sh
npm run lint
npm run build:ui
npm run test:unit
npm run test:electron
```

Manual checks:

- open console from repository root
- open console from a worktree
- create multiple shells
- switch, close, hide, restore, dock, and expand sessions
- restart after shell spawn failure or exited process
- resize the app and sidebar while terminal output is visible
- test long workspace names and terminal titles
- test light and dark themes

## Risks

- xterm sizing is sensitive to wrapper layout; visual padding must not create rendering bugs.
- Terminal reliability issues may be main-process/runtime issues, not just UI issues.
- A session dropdown can help crowded tabs, but adding it too early may overcomplicate the current dock.
- Link handling and path actions should not imply a full file explorer unless implemented.
