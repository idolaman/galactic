# Galactic UI Redesign Plan

## Purpose

This plan turns the broad "make Galactic look professional" goal into a staged redesign that can be implemented one slice at a time.

The target is a serious developer workbench for parallel projects, branch workspaces, local services, and AI agent sessions. The app should feel closer to GitHub Desktop, VS Code, Linear, Superset, and native macOS tooling than to a decorative AI dashboard.

## Product Bet

Galactic will feel more trustworthy and professional when the interface proves that it understands the user's workflow:

- projects and workspaces are visible without ceremony
- local service and routing status is legible
- editor, console, and agent actions are close to the thing they affect
- advanced details are available, but not forced into the default view
- visual styling is calm, dense, consistent, and token-driven

## Non-Goals

- Do not redesign the product into a marketing page.
- Do not introduce a new frontend framework.
- Do not replace shadcn/Radix primitives unless a local primitive is clearly blocking quality.
- Do not solve merge conflicts, orchestration, billing, or team collaboration in this redesign.
- Do not copy Superset visually; reuse its desktop-workbench discipline and density.

## Sequence

Implement in this order:

1. [Product Direction](./00-product-direction.md)
2. [Shell And Theme](./01-shell-and-theme.md)
3. [Sidebar Navigation](./02-sidebar-navigation.md)
4. [Projects And Workspaces](./03-projects-and-workspaces.md)
5. [Configuration And Dialogs](./04-configuration-and-dialogs.md)
6. [Quick Launcher And Settings](./05-quick-launcher-and-settings.md)
7. [Visual QA And Release Criteria](./06-visual-qa-and-release.md)

Each step should be a separate implementation pass. Later steps may refine earlier work, but should not reopen the whole app design unless a validation issue proves the foundation is wrong.

## Global Design Rules

- Treat the redesign as a shared product design system, not as one-off screen styling.
- New features must use the shared tokens, shell primitives, and app-level components before adding local styles.
- Prefer dense lists, tables, split panes, and toolbars over large cards.
- Use cards only for repeated items, dialogs, and framed tools.
- Use one primary accent color and semantic status colors only.
- Remove glow shadows, decorative backgrounds, and large gradients from product surfaces.
- Keep page headings compact; reserve hero-scale type for true empty states only.
- Use icons for tool actions and concise text for commands.
- Expose technical details when they help users act, debug, or trust the state.
- Preserve keyboard and power-user affordances where they already exist.

## Design System Ownership

The redesign should live in a few stable places:

- `src/index.css`: global tokens, theme colors, typography, scrollbars, and base layout rules.
- `src/components/ui/*`: low-level shadcn/Radix primitives such as button, dialog, input, badge, table, tabs, and tooltip.
- `src/components/app/*`: Galactic-specific app primitives introduced by the redesign, such as app shell, page toolbar, status badge, empty state, settings row, section header, and inspector panel.
- feature folders: feature-specific composition only. A feature can arrange shared primitives, but should not redefine the visual language.

This keeps future features consistent without making the design system a single oversized file.

## Global Acceptance Criteria

- The default app view reads as a developer workbench, not a landing page.
- The main workflow can be understood from project, workspace, service, and session state without reading long explanatory copy.
- Light and dark themes both look intentional.
- No text overlap at common desktop sizes.
- Sidebar collapse, console dock, dialogs, empty states, and quick launcher all remain usable.
- Existing behavior is preserved unless a step explicitly changes it.
