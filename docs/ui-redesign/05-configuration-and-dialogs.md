# Step 5: Configuration And Dialogs

## Goal

Make setup and configuration flows feel deliberate, trustworthy, and compact. Dialogs should guide decisions without reading like documentation pages.

## Scope

Update:

- `src/components/CreateWorkspaceDialog.tsx`
- `src/components/CreateWorkspaceDialogIntro.tsx`
- `src/components/CreateWorkspaceBranchStep.tsx`
- `src/components/CreateWorkspaceBaseBranchStep.tsx`
- `src/components/CreateWorkspaceExistingBranchItem.tsx`
- `src/components/CreateWorkspaceNewBranchItem.tsx`
- `src/components/WorkspaceIsolationDialog.tsx`
- `src/components/WorkspaceIsolationDialogBody.tsx`
- `src/components/WorkspaceIsolationDialogLead.tsx`
- `src/components/WorkspaceIsolationDialogConfigurationStep.tsx`
- `src/components/WorkspaceIsolationDialogServiceCard.tsx`
- `src/components/WorkspaceIsolationActivateWorkspaceStep.tsx`
- `src/components/ProjectConfigImportReviewDialog.tsx`

## Design Changes

### Dialog System

Create a consistent dialog pattern:

- compact title and description
- clear step indicator only when multi-step
- primary content area with stable height where practical
- footer with Back, Cancel, and primary action
- inline validation near the field it affects
- final confirmation that names what will change

### Create Workspace Flow

The default path should be fast:

1. Choose branch mode.
2. Confirm base branch if needed.
3. Name/create workspace.
4. Show success or explicit error.

Power-user affordances:

- branch search
- existing branch reuse
- clear naming preview
- keyboard-friendly selection

### Project Services / Workspace Isolation

Mechanism details matter here, but should be layered:

- default view: service name, folder, route, port behavior
- details view: generated env vars, proxy target, shell hook behavior
- proof: route preview and compatibility note

Avoid front-loading internal terms like "workspace isolation" if a user-facing phrase is clearer. Prefer `Project Services` in top-level copy and reveal implementation details below.

### Import Review

Config import should look like a review table:

- file/path
- action
- target
- conflict/warning state
- final apply confirmation

## Acceptance Criteria

- Every dialog has one obvious primary action.
- Multi-step dialogs preserve orientation without excessive copy.
- Validation and blocked states are specific.
- Dangerous or irreversible actions require explicit confirmation.
- Project Services setup explains enough to trust routing without overwhelming the default screen.
- Dialogs fit common laptop heights without important footer actions leaving the viewport.

## Verification

Run:

```sh
npm run lint
npm run build:ui
```

Manual checks:

- create workspace from new branch
- create workspace from existing branch
- loading branches
- branch loading error
- Project Services setup for single-app and multi-service projects
- activation target selection
- import config with conflicts
- blocked/invalid form state

## Risks

- Existing dialog logic is spread across many small components; visual unification should not collapse useful state boundaries.
- Project Services copy can easily overpromise framework support if not tied to current behavior.
- Long paths and service names can break compact dialog layouts.
