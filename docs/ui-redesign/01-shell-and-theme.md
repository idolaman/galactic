# Step 1: Shell And Theme

## Goal

Create the professional foundation before changing feature screens. This step should make the whole app feel calmer and more coherent without moving major workflows yet.

## Scope

Update:

- `src/index.css`
- `src/App.css`
- `src/App.tsx`
- `src/components/Header.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/StarsBackground.tsx`
- shared button/card/badge defaults only if needed

Do not rebuild project/workspace content in this step.

## Design System Shape

This step should establish a shared design system for future features. Keep it centralized by responsibility:

- `src/index.css`: product tokens, theme variables, typography defaults, scrollbar rules, and global app layout behavior.
- `src/components/ui/*`: generic primitives already provided by shadcn/Radix.
- `src/components/app/*`: Galactic-specific primitives created during the redesign.

Recommended app primitives to introduce as needed:

- `AppShell`
- `AppToolbar`
- `PageToolbar`
- `SectionHeader`
- `StatusBadge`
- `EmptyState`
- `InspectorPanel`
- `SettingsRow`

Feature components should consume these primitives instead of creating new local card, toolbar, badge, empty-state, or shell styles.

## Design Changes

### Theme Tokens

Replace the current glow/gradient-heavy tokens with neutral product tokens:

- `--background`
- `--foreground`
- `--card`
- `--popover`
- `--primary`
- `--secondary`
- `--muted`
- `--accent`
- `--border`
- `--input`
- `--ring`
- `--success`
- `--warning`
- `--destructive`

Add optional semantic aliases only if they are used consistently:

- `--surface`
- `--surface-raised`
- `--surface-sunken`
- `--border-subtle`
- `--text-subtle`

### Remove Decorative Chrome

- Remove `StarsBackground` from the authenticated app shell, or make it inactive behind product views.
- Remove `--gradient-primary`, `--gradient-card`, and `--shadow-glow` usage from core surfaces.
- Replace glow hover states with border, background, or foreground changes.

### App Shell

Change the header from a branded hero strip into a compact desktop toolbar:

- height: 44-52px
- left: sidebar trigger and optional app mark
- center: route/workspace context if useful
- right: command/search entry, theme toggle, user menu, logout
- avoid large "Galactic" gradient text in the product chrome

The app should preserve the macOS desktop feel:

- stable app-height layout
- no body scrolling leaks
- no page max-width from default Vite CSS
- predictable toolbar and sidebar boundaries

## Suggested Superset References

- `../../../superset/apps/desktop/src/renderer/globals.css`
- `../../../superset/apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/TopBar/TopBar.tsx`
- `../../../superset/apps/desktop/src/renderer/routes/_authenticated/_dashboard/layout.tsx`

Use these for density and shell structure, not for direct copy-paste.

## Acceptance Criteria

- The app launches into a neutral desktop shell with no starfield or glow-driven visual system.
- Header height is compact and consistent.
- Sidebar and content use the same surface/border language.
- Light and dark themes are both legible.
- `App.css` no longer contains unused Vite starter styles.
- Existing routes, auth gate, sidebar toggle, toasts, and console dock still work.

## Verification

Run:

```sh
npm run lint
npm run build:ui
```

Manual checks:

- authenticated app shell
- logged-out GitHub auth screen
- quick-sidebar route is not broken
- dark and light theme toggle
- narrow desktop width around 1024px

## Risks

- Token changes can silently affect every shadcn component.
- Removing decorative styles may expose spacing problems in deeper screens.
- Header changes can collide with Electron/macOS drag regions if added later.
