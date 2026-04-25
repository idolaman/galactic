import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildWorkspaceIsolationUrl } from "./routing.js";
import type { WorkspaceIsolationShellHookStatus, WorkspaceIsolationStack } from "./types.js";

const START_MARKER = "# >>> Galactic Workspace Isolation >>>";
const END_MARKER = "# <<< Galactic Workspace Isolation <<<";

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getStatePaths = (stateDir: string, homeDir: string) => ({
  hookPath: path.join(stateDir, "shell", "workspace-isolation.zsh"),
  statePath: path.join(stateDir, "shell", "workspace-isolation-state.zsh"),
  zshrcPath: path.join(homeDir, ".zshrc"),
});

const buildStateScript = (
  workspaceIsolationStacks: WorkspaceIsolationStack[],
): string => {
  const roots = workspaceIsolationStacks
    .map((stack) => shellQuote(stack.workspaceRootPath))
    .join(" ");
  const exportsEntries = workspaceIsolationStacks.flatMap((stack) =>
    stack.services.map((service) => {
      const exports = [`HOST\t127.0.0.1`, `PORT\t${service.port}`];
      service.connections.forEach((connection) => {
        const targetStack = workspaceIsolationStacks.find(
          (item) => item.id === connection.targetStackId,
        );
        const targetService = targetStack?.services.find((item) => item.id === connection.targetServiceId);
        if (targetStack && targetService) {
          exports.push(`${connection.envKey.trim()}\t${buildWorkspaceIsolationUrl(targetStack, targetService)}`);
        }
      });
      return `  [${shellQuote(`${stack.workspaceRootPath}|${service.relativePath}`)}]=${shellQuote(exports.join("\n"))}`;
    }),
  );
  return [
    `typeset -ga GALACTIC_WORKSPACE_ROOTS=(${roots})`,
    "typeset -gA GALACTIC_SERVICE_EXPORTS=(",
    ...exportsEntries,
    ")",
  ].join("\n");
};

const buildHookScript = (statePath: string): string => `[[ -f ${shellQuote(statePath)} ]] && source ${shellQuote(statePath)}
typeset -ga GALACTIC_ACTIVE_EXPORT_KEYS=()
galactic_workspace_isolation_clear() {
  local key
  for key in "\${GALACTIC_ACTIVE_EXPORT_KEYS[@]}"; do
    unset "$key"
  done
  GALACTIC_ACTIVE_EXPORT_KEYS=()
}
galactic_workspace_isolation_matches_path() {
  [[ "$1" == "$2" || "$1" == "$2"/* ]]
}
galactic_workspace_isolation_apply() {
  emulate -L zsh
  local cwd="$PWD" best_root="" root
  for root in "\${GALACTIC_WORKSPACE_ROOTS[@]}"; do
    if galactic_workspace_isolation_matches_path "$cwd" "$root" && (( \${#root} > \${#best_root} )); then
      best_root="$root"
    fi
  done
  galactic_workspace_isolation_clear
  [[ -z "$best_root" ]] && return
  local key best_key="" best_length=-1 relative_path absolute_path
  for key in "\${(@k)GALACTIC_SERVICE_EXPORTS}"; do
    [[ "$key" != "$best_root|"* ]] && continue
    relative_path=\${key#\${best_root}|}
    if [[ "$relative_path" == "." ]]; then
      absolute_path="$best_root"
    else
      absolute_path="$best_root/$relative_path"
    fi
    if galactic_workspace_isolation_matches_path "$cwd" "$absolute_path" && (( \${#absolute_path} > best_length )); then
      best_length=\${#absolute_path}
      best_key="$key"
    fi
  done
  [[ -z "$best_key" ]] && return
  local line name value
  while IFS=$'\\t' read -r name value; do
    [[ -z "$name" ]] && continue
    export "$name=$value"
    GALACTIC_ACTIVE_EXPORT_KEYS+=("$name")
  done <<< "\${GALACTIC_SERVICE_EXPORTS[$best_key]}"
}
if [[ "\${chpwd_functions[(r)galactic_workspace_isolation_apply]}" != "galactic_workspace_isolation_apply" ]]; then
  chpwd_functions+=(galactic_workspace_isolation_apply)
fi
galactic_workspace_isolation_apply
`;

const replaceManagedBlock = (content: string, nextBlock: string): string => {
  const pattern = new RegExp(`${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}\\n?`, "g");
  const cleaned = content.replace(pattern, "").trimEnd();
  return `${cleaned ? `${cleaned}\n\n` : ""}${nextBlock}\n`;
};

const removeManagedBlock = (content: string): string =>
  content.replace(new RegExp(`${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}\\n?`, "g"), "").trimEnd();

export const syncWorkspaceIsolationShellFiles = async (
  stateDir: string,
  workspaceIsolationStacks: WorkspaceIsolationStack[],
  enabled: boolean,
  platform: NodeJS.Platform,
  homeDir = os.homedir(),
): Promise<WorkspaceIsolationShellHookStatus> => {
  const supported = platform !== "win32";
  const { hookPath, statePath, zshrcPath } = getStatePaths(stateDir, homeDir);
  if (!supported) {
    return { enabled: false, supported: false, installed: false, hookPath: null, zshrcPath: null, message: "Workspace Isolation shell hooks are available only on macOS and Linux zsh." };
  }
  await fs.mkdir(path.dirname(hookPath), { recursive: true });
  await fs.writeFile(
    statePath,
    buildStateScript(workspaceIsolationStacks),
    "utf-8",
  );
  await fs.writeFile(hookPath, buildHookScript(statePath), "utf-8");
  const managedBlock = `${START_MARKER}\n[[ -f ${shellQuote(hookPath)} ]] && source ${shellQuote(hookPath)}\n${END_MARKER}`;
  const currentZshrc = existsSync(zshrcPath) ? await fs.readFile(zshrcPath, "utf-8") : "";
  const nextZshrc = enabled ? replaceManagedBlock(currentZshrc, managedBlock) : removeManagedBlock(currentZshrc);
  if (nextZshrc !== currentZshrc) {
    await fs.writeFile(zshrcPath, nextZshrc ? `${nextZshrc}\n` : "", "utf-8");
  }
  return {
    enabled,
    supported: true,
    installed: enabled,
    hookPath,
    zshrcPath,
    message: enabled ? "Restart zsh or run `source ~/.zshrc` to activate Workspace Isolation shell hooks." : "Workspace Isolation shell hooks are disabled.",
  };
};
