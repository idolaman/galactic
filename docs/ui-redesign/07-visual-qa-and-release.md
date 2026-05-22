# Step 7: Visual QA And Release Criteria

## Goal

Validate the redesign as a complete product experience before considering it done.

## Required Checks

### Layout

- no overlapping text or controls
- no horizontal page overflow
- no clipped dialog footers
- no route where content is hidden behind the console dock
- sidebar collapse and expansion preserve state
- content remains usable around 1024px desktop width

### Visual System

- no glow shadows on core product surfaces
- no decorative star/space background behind authenticated product views
- no large gradients in operational UI
- no one-note color palette
- typography scale is compact and consistent
- cards are not nested inside cards
- status colors are semantic and reserved

### Workflow

- add project
- select project
- create workspace
- delete workspace
- open workspace in editor
- open workspace console
- configure Project Services
- import project config
- change environment binding
- use quick launcher
- change settings

### States

Check every redesigned surface for:

- default
- loading
- empty
- success
- error
- blocked
- disabled
- long names and paths

## Suggested Automated Verification

Run:

```sh
npm run lint
npm run build:ui
npm run test:unit
```

If the app is running in development, capture screenshots for:

- main route empty state
- project list
- project detail with multiple workspaces
- Project Services dialog
- create workspace dialog
- quick launcher
- settings
- environments
- light theme
- dark theme

## Release Criteria

The redesign is ready when:

- all plan steps are implemented
- main surfaces share the same token and spacing system
- no known workflow regressed
- no major visual inconsistency remains between main app, quick launcher, dialogs, settings, and console dock
- screenshot review passes for common desktop widths
- lint and build pass

## Residual Risks To Recheck

- Electron window chrome and drag regions may need a separate native polish pass.
- Terminal rendering, runtime reliability, and link handling should be rechecked after the console dock redesign.
- Some state, such as live service status, may require future data/model work to make the UI fully truthful.
- Accessibility should be audited beyond visual QA if the redesign changes focus order or dialog structure.
