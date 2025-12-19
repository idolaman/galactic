export type AnalyticsEvent =
  | "App.launched"
  | "Error.gitFailed"
  | "Workspace.created"
  | "Workspace.deleted"
  | "Workspace.configFileAdded"
  | "Workspace.filesCopied"
  | "Project.added"
  | "Project.removed"
  | "MCP.connected"
  | "MCP.sessionFocused"
  | "MCP.sessionStatusChanged"
  | "Environment.created"
  | "Environment.deleted"
  | "Environment.attached"
  | "Environment.detached"
  | "Environment.updated"
  | "Editor.launched"
  | "QuickLauncher.toggled"
  | "QuickLauncher.navigated"
  | "QuickLauncher.workspaceOpened"
  | "Update.completed";

export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;
