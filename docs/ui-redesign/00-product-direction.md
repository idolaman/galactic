# Step 0: Product Direction

## Problem Statement

- Primary gap: Galactic's current UI communicates the right features, but the visual language makes the app feel less mature than the workflow it is trying to own.
- Primary user: developers running parallel branches, worktrees, project services, and AI-assisted coding sessions.
- Why this matters: these users evaluate the app by trust, speed, state clarity, and compatibility. Decorative or inconsistent UI makes the product feel less reliable.

## Product Outcome

Galactic should feel like a command center for real development work:

- immediate visibility into projects and workspaces
- fast launch and switching between work contexts
- clear proof of what is running, routed, synced, or needs attention
- low-friction access to editor, console, service, and agent actions
- enough mechanism detail to trust the system without making the app feel like setup docs

## Design Lens

### Power Users

Power users need leverage and proof.

- Show state before explanation.
- Keep rows compact.
- Make hover actions and keyboard paths available.
- Do not hide paths, branches, ports, or service status when they matter.

### Aspiring Users

Aspiring users need clarity and safe defaults.

- Use outcome labels before implementation terms.
- Keep setup decisions guided.
- Explain routing, shell hooks, and editor integration only at the moment they affect a choice.
- Make disabled and unsupported states specific.

## Visual Direction

Adopt a professional desktop utility style:

- neutral layered surfaces
- compact top toolbar
- dense resizable sidebar
- main content as tables, lists, and detail panes
- restrained icons and status marks
- subtle borders instead of glow
- limited accent use

Avoid:

- space/star decoration in core app chrome
- gradient cards
- glow shadows
- oversized headings inside operational views
- marketing copy in the logged-in app
- single-hue visual themes

## Current Surfaces To Preserve

- Main project route: `src/pages/Index.tsx`
- App shell: `src/App.tsx`, `src/components/Header.tsx`, `src/components/AppSidebar.tsx`
- Project list: `src/components/ProjectList.tsx`
- Project detail: `src/components/ProjectDetail.tsx`
- Workspaces: `src/components/ProjectWorkspacesSection.tsx`, `src/components/ProjectWorkspaceCard.tsx`
- Console dock: `src/components/WorkspaceConsole/*`
- Quick launcher: `src/pages/QuickSidebar.tsx`, `src/components/QuickSidebar/*`
- Settings and environments: `src/pages/Settings.tsx`, `src/pages/Environments.tsx`

## Success Signals

- A new user can identify the primary action in under five seconds.
- A returning user can scan project/workspace state without opening dialogs.
- Running services and agent sessions feel connected to the relevant workspace.
- The interface does not look generated from isolated component snippets.
- The same visual rules apply across main app, quick launcher, dialogs, and settings.

## Failure Conditions

- The redesign only changes colors while keeping the same card-heavy hierarchy.
- The interface becomes prettier but less dense or less useful.
- Product surfaces rely on long copy to explain normal operation.
- Important operational state is hidden behind generic badges or dialogs.
- The console dock, quick launcher, or settings retain an unrelated visual style.
