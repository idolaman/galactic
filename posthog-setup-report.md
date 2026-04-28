<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Galactic IDE. PostHog is initialized in `src/main.tsx` using `posthog-js/dist/module.full.no-external` — the Electron-safe bundle that pre-packages all extensions without loading remote scripts. Environment variables (`VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST`) are stored in `.env` and referenced at build time via `import.meta.env`.

User identification is wired in `src/App.tsx`: `posthog.identify()` is called on login with the user's name, and `posthog.reset()` is called on logout to unlink future events. All existing analytics events in `src/services/analytics.ts` now fire both to TelemetryDeck (via Electron IPC) and to PostHog, so no existing instrumentation was disrupted. Two additional events were added in `src/pages/Settings.tsx` for editor preference changes and MCP tool installations.

| Event | Description | File |
|---|---|---|
| `User.loggedIn` | User completes the login/enter flow | `src/App.tsx` |
| `User.loggedOut` | User clicks logout in the header | `src/App.tsx` |
| `Project.added` | User adds a new project | `src/services/analytics.ts` |
| `Project.removed` | User removes a project | `src/services/analytics.ts` |
| `Workspace.configFileAdded` | User adds a sync target to a project | `src/services/analytics.ts` |
| `Environment.created` | User creates a new environment | `src/services/analytics.ts` |
| `Environment.deleted` | User deletes an environment | `src/services/analytics.ts` |
| `Environment.attached` | User attaches a workspace to an environment | `src/services/analytics.ts` |
| `Environment.detached` | User detaches a workspace from an environment | `src/services/analytics.ts` |
| `Environment.updated` | User updates environment variables | `src/services/analytics.ts` |
| `QuickLauncher.navigated` | User navigates the Quick Launcher with arrow keys | `src/services/analytics.ts` |
| `QuickLauncher.workspaceOpened` | User opens a workspace via Quick Launcher | `src/services/analytics.ts` |
| `MCP.sessionFocused` | User focuses an MCP session | `src/services/analytics.ts` |
| `MCP.sessionStatusChanged` | An MCP session changes status | `src/services/analytics.ts` |
| `Settings.editorChanged` | User changes their preferred editor | `src/pages/Settings.tsx` |
| `Settings.mcpInstalled` | User successfully installs Galactic MCP | `src/pages/Settings.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/400241/dashboard/1517101
- **Daily Active Users (Logins)**: https://us.posthog.com/project/400241/insights/YmzbkfaB
- **Project Growth (Added vs Removed)**: https://us.posthog.com/project/400241/insights/TOHCsQoR
- **Quick Launcher Workspace Opens**: https://us.posthog.com/project/400241/insights/7uXn0uhL
- **Environment Adoption Funnel**: https://us.posthog.com/project/400241/insights/ZzysTX5m
- **MCP Installations by Tool**: https://us.posthog.com/project/400241/insights/kcgjfn1r

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
