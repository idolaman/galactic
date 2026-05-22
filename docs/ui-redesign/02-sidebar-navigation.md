# Step 2: Sidebar Navigation

## Goal

Turn the sidebar into the primary operational map of Galactic: projects, repository roots, workspaces, running sessions, and attention states.

## Scope

Update:

- `src/components/AppSidebar.tsx`
- `src/components/AppSidebar/SidebarNavigation.tsx`
- `src/components/AppSidebar/WorkspaceSidebarGroup.tsx`
- `src/components/AppSidebar/SidebarWorkspaceItem.tsx`
- `src/components/AppSidebar/SidebarSessionItem.tsx`
- `src/components/AppSidebar/McpInstallBanner.tsx`
- `src/components/NavLink.tsx`

Do not redesign the main project page yet.

## Design Changes

### Sidebar Structure

Use this hierarchy:

1. Primary navigation: Projects, Environments, Settings.
2. Projects section: project groups with root and workspaces.
3. Active sessions: shown inline under their workspace when possible.
4. Setup/status banners: compact and dismissible where possible.

### Density

- Use 28-36px rows for navigation and workspace items.
- Use project group headers with small uppercase or medium-weight labels.
- Use icons as state hints, not decoration.
- Keep branch/workspace names truncating cleanly.
- Use hover actions for secondary commands.

### Status Model

Represent state consistently:

- active route: left indicator or filled row background
- unread/attention: small dot or status mark
- active agent session: compact session row or inline count
- unsupported/missing MCP: subtle setup row, not a large promotional banner

### Collapsed State

If the existing sidebar collapse stays:

- collapsed items must retain tooltips
- active state must remain visible
- project/workspace identity must still be discoverable on hover

## Suggested Superset References

- `../../../superset/apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/DashboardSidebar.tsx`
- `../../../superset/apps/desktop/src/renderer/screens/main/components/WorkspaceSidebar/WorkspaceListItem/WorkspaceListItem.tsx`
- `../../../superset/apps/desktop/src/renderer/screens/main/components/WorkspaceSidebar/WorkspaceSidebar.tsx`

## Acceptance Criteria

- A user can scan all projects and workspaces from the sidebar without opening the main page.
- Active route and active workspace state are visually obvious.
- Agent sessions are visibly connected to the workspace they belong to.
- MCP setup does not dominate the sidebar.
- Sidebar remains usable when collapsed.
- Sidebar items do not rely on glow, large badges, or verbose copy.

## Verification

Run:

```sh
npm run lint
npm run build:ui
```

Manual checks:

- no projects
- one project with no workspaces
- multiple projects with several workspaces
- active agent session visible
- collapsed and expanded sidebar
- long project and branch names

## Risks

- The sidebar data comes from multiple stores, so visual grouping must not assume all state exists at once.
- Session visibility can create noisy rows if not constrained.
- Collapsed behavior can regress accessibility if tooltips and labels are not preserved.
