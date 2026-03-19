import { CLAUDE_MARKETPLACE_NAME, CLAUDE_PLUGIN_NAME } from "./paths.js";

const commandFor = (runnerPath: string) => `"${runnerPath.replace(/"/g, '\\"')}"`;

const hookCommand = (runnerPath: string) => ({
  hooks: [{ type: "command", command: commandFor(runnerPath) }],
});

export const buildClaudeMarketplaceManifest = (runnerPath: string): string => {
  const manifest = {
    name: CLAUDE_MARKETPLACE_NAME,
    owner: { name: "Galactic Dev" },
    plugins: [
      {
        name: CLAUDE_PLUGIN_NAME,
        source: `./plugins/${CLAUDE_PLUGIN_NAME}`,
        strict: false,
        description: "Galactic IDE lifecycle hooks",
        hooks: {
          UserPromptSubmit: [hookCommand(runnerPath)],
          PermissionRequest: [hookCommand(runnerPath)],
          PostToolUse: [hookCommand(runnerPath)],
          PostToolUseFailure: [hookCommand(runnerPath)],
          Stop: [hookCommand(runnerPath)],
          SessionEnd: [hookCommand(runnerPath)],
        },
      },
    ],
  };

  return JSON.stringify(manifest, null, 2);
};

export const buildClaudePluginReadme = (): string => "# Galactic IDE Hooks\n";
