# Step 5: Quick Launcher And Settings

## Goal

Bring secondary surfaces into the same professional system so the redesign does not stop at the main route.

## Scope

Update:

- `src/pages/QuickSidebar.tsx`
- `src/components/QuickSidebar/*`
- `src/pages/Settings.tsx`
- `src/pages/Environments.tsx`
- `src/components/Settings/*`
- `src/components/ModeToggle.tsx`
- `src/components/GitHubAuth.tsx` if needed for visual consistency

## Design Changes

### Quick Launcher

The quick launcher should feel like a command palette for workspaces:

- compact search header
- grouped project/workspace results
- active sessions inline
- keyboard-first selection
- clear empty and no-results states
- footer hints kept minimal

Avoid:

- heavy contrast that feels detached from the main app
- decorative labels
- oversized group headings

### Settings

Settings should become a calm two-level settings layout:

- left or top section navigation if the page grows
- compact setting rows/cards
- status and install state visible inline
- consistent save/loading/error behavior

Preferred editor:

- keep recognizable app icons
- reduce card size
- make installed/unavailable state obvious

MCP installation:

- present as integrations with status and actions
- separate installed, installable, unsupported, and error states
- keep config details behind a disclosure or dialog

### Environments

Environment management should read as configuration, not as cards:

- list environments on one side
- detail editor on the other
- env vars as editable rows
- bindings and relaunch implications clearly visible

## Acceptance Criteria

- Quick launcher visually belongs to the same app.
- Search, empty, and no-results states are clear.
- Settings page no longer feels like independent large cards stacked vertically.
- Editor and MCP status are scannable.
- Environment variable editing is compact and predictable.
- Async setting cards share consistent loading, success, and error treatment.

## Verification

Run:

```sh
npm run lint
npm run build:ui
```

Manual checks:

- quick launcher with no projects
- quick launcher with multiple projects and sessions
- search no-results state
- settings editor detection
- MCP install status
- global hotkey highlight route
- environment create, rename, delete
- env var add/remove

## Risks

- Quick launcher may run in a different window size and route context.
- Settings contains async native integration checks; visual loading states must not imply completion.
- Environment edits auto-save, so the UI must make persistence and relaunch implications clear.
