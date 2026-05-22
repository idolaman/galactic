# Step 3: Projects And Workspaces

## Goal

Replace the card-heavy project and workspace screens with operational views that help users scan, launch, compare, and manage work contexts quickly.

## Scope

Update:

- `src/pages/Index.tsx`
- `src/components/ProjectList.tsx`
- `src/components/ProjectDetail.tsx`
- `src/components/ProjectDetailHeader.tsx`
- `src/components/ProjectWorkspacesSection.tsx`
- `src/components/ProjectWorkspacesGrid.tsx`
- `src/components/ProjectWorkspaceCard.tsx`
- `src/components/LaunchButton.tsx`
- related empty states

Do not redesign complex setup dialogs in this step.

## Design Changes

### Project List

Move from large cards to a compact project table/list.

Recommended columns or row regions:

- project name
- path
- Git status
- workspace count
- active session count
- configured services count if available
- quick actions: open, reveal, remove

Primary action:

- `Add Project` stays in the page toolbar.

Empty state:

- centered or inline empty state with one clear action
- no hero-scale marketing copy

### Project Detail

Use a split operational layout:

- compact project toolbar at top
- workspace list/table as the primary content
- service/routing/config proof as secondary panels
- config sync section below or in a detail panel

### Workspace Rows

Replace `ProjectWorkspaceCard` with a denser row or table item.

Each workspace should show:

- root/worktree identity
- branch/workspace label
- path
- environment binding
- routing/service state
- console action
- open editor action
- delete action on hover or menu

Keep workspace-specific networking visible, but avoid expanding every row into a large card by default. Use progressive disclosure for details.

### State Language

Use specific labels:

- `Repository root`
- `Worktree`
- `No Git`
- `Routing configured`
- `Needs relaunch`
- `No environment`
- `Console open`

Avoid vague labels:

- `Active`
- `Enabled`
- `Configured`

unless the surrounding context makes them obvious.

## Acceptance Criteria

- Project list fits at least 6-8 projects on a typical laptop viewport.
- Workspace list fits at least 5-7 workspaces without feeling cramped.
- Primary actions remain one click away.
- Destructive actions are available but visually secondary.
- Paths and long branch names truncate with tooltips or title attributes.
- Repository root and worktree rows are visually distinct without oversized cards.
- Existing create, delete, open, console, environment, and config sync behavior still works.

## Verification

Run:

```sh
npm run lint
npm run build:ui
```

Manual checks:

- empty project list
- non-Git project
- Git project with root only
- Git project with multiple worktrees
- delete project confirmation
- delete workspace confirmation
- open editor action
- open console action
- environment binding change

## Risks

- Moving from cards to rows may require extracting small primitives to keep files readable.
- `WorkspaceNetworkingPanel` may be too large for a row and may need a compact variant.
- Config sync can become buried if moved too far from workspace creation.
