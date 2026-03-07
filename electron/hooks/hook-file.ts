import { promises as fs } from "node:fs";
import path from "node:path";

const createCommandHook = (commandPath: string, platform: string) => ({
  hooks: [
    {
      type: "command",
      command: `"${commandPath}" ${platform.toLowerCase()}`,
    },
  ],
});

export const buildHookFile = (commandPath: string, platform: string) => {
  const hook = createCommandHook(commandPath, platform);
  return {
    SessionStart: [hook],
    UserPromptSubmit: [hook],
    PermissionRequest: [hook],
    PostToolUse: [hook],
    PostToolUseFailure: [hook],
    Stop: [hook],
    SessionEnd: [hook],
  };
};

export const writeHookFile = async (filePath: string, commandPath: string, platform: string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(buildHookFile(commandPath, platform), null, 2), "utf8");
};
