import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  type OpenDialogOptions,
} from "electron";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
import { promises as fsPromises } from "node:fs";
import { execFile, exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { ExecFileException } from "node:child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

type EditorLaunchResolver = (projectPath: string) => string;

const quotePath = (value: string) => JSON.stringify(value);

const cursorCommand = (projectPath: string) =>
  `open -a "Cursor" ${quotePath(projectPath)}`;
const vscodeOpenCommand = (projectPath: string) =>
  `open -a "Visual Studio Code" ${quotePath(projectPath)}`;
const cursorCli = (projectPath: string) => `cursor ${quotePath(projectPath)}`;
const vscodeCli = (projectPath: string) => `code ${quotePath(projectPath)}`;

const editorLaunchCommands: Record<
  string,
  Partial<Record<NodeJS.Platform, EditorLaunchResolver>>
> = {
  Cursor: {
    darwin: cursorCommand,
    win32: cursorCli,
    linux: cursorCli,
  },
  VSCode: {
    darwin: vscodeOpenCommand,
    win32: vscodeCli,
    linux: vscodeCli,
  },
};

const resolveEditorCommand = (editorName: string, projectPath: string) => {
  const editorConfig = editorLaunchCommands[editorName];
  if (!editorConfig) {
    return null;
  }

  return editorConfig[process.platform]?.(projectPath) ?? null;
};

const VITE_DEV_SERVER_URL =
  process.env.ELECTRON_START_URL || process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    backgroundColor: "#0f172a",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (app.isPackaged === false) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(
      path.join(__dirname, "../dist/index.html"),
      {
        hash: "/",
      }
    );
  }
};

ipcMain.handle("ping", () => {
  return "pong";
});

ipcMain.handle("check-editor-installed", (_event, editorName: string) => {
  const editorPaths: Record<string, string> = {
    Cursor: "/Applications/Cursor.app",
    VSCode: "/Applications/Visual Studio Code.app",
  };
  
  const editorPath = editorPaths[editorName];
  if (!editorPath) return false;
  
  return existsSync(editorPath);
});

app.whenReady().then(() => {
  createWindow().catch((error) => {
    console.error("Failed to create window:", error);
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        console.error("Failed to re-create window:", error);
        app.quit();
      });
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("os/choose-project-directory", async () => {
  const windowRef = BrowserWindow.getFocusedWindow() ?? mainWindow ?? null;
  const dialogOptions: OpenDialogOptions = {
    properties: ["openDirectory", "createDirectory"] as OpenDialogOptions["properties"],
  };
  const result = windowRef
    ? await dialog.showOpenDialog(windowRef, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("git/get-info", async (_event, projectPath: string) => {
  if (!projectPath) {
    return { isGitRepo: false };
  }

  const gitDirExists = existsSync(path.join(projectPath, ".git"));
  if (!gitDirExists) {
    return { isGitRepo: false };
  }

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd: projectPath }
    );
    return {
      isGitRepo: true,
      currentBranch: stdout.trim() || "HEAD",
    };
  } catch (error) {
    console.warn(`Failed to read git branch for ${projectPath}:`, error);
    return { isGitRepo: true, currentBranch: "HEAD" };
  }
});

ipcMain.handle(
  "editor/open-project",
  async (_event, editorName: string, projectPath: string) => {
    if (!projectPath) {
      return { success: false, error: "No project path provided." };
    }

    if (!existsSync(projectPath)) {
    return { success: false, error: "Project path does not exist." };
  }

    const commandString = resolveEditorCommand(editorName, projectPath);
    if (!commandString) {
      return { success: false, error: `Editor ${editorName} is not supported on this platform.` };
    }

    try {
      await execAsync(commandString);
      return { success: true };
    } catch (error) {
      console.error(`Failed to open ${editorName} for ${projectPath}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

ipcMain.handle("git/create-worktree", async (_event, projectPath: string, branch: string) => {
  if (!projectPath || !branch) {
    return { success: false, error: "Project path and branch are required." };
  }

  const gitDirExists = existsSync(path.join(projectPath, ".git"));
  if (!gitDirExists) {
    return { success: false, error: "Git repository not found." };
  }

  const sanitizedBranch = branch.replace(/[\\/]/g, "-");
  const projectParent = path.resolve(projectPath, "..");
  const projectName = path.basename(projectPath);
  const globalWorktreeRoot = path.join(projectParent, ".worktrees");
  const worktreeRoot = path.join(globalWorktreeRoot, projectName);
  try {
    if (!existsSync(globalWorktreeRoot)) {
      mkdirSync(globalWorktreeRoot, { recursive: true });
    }
    if (!existsSync(worktreeRoot)) {
      mkdirSync(worktreeRoot, { recursive: true });
    }
  } catch (error) {
    console.error("Failed to ensure worktree directory:", error);
    return { success: false, error: "Unable to prepare worktree directory." };
  }
  const targetPath = path.join(worktreeRoot, sanitizedBranch);

  try {
    await execFileAsync("git", ["worktree", "add", targetPath, branch], { cwd: projectPath });
    return { success: true, path: targetPath };
  } catch (error) {
    console.error(`Failed to create worktree for ${branch} at ${projectPath}:`, error);
    const execError = error as ExecFileException & { stderr?: string };
    const errorMessage = execError?.stderr || execError?.message || "Unknown error creating worktree.";
    return {
      success: false,
      error: errorMessage,
    };
  }
});

ipcMain.handle("git/remove-worktree", async (_event, projectPath: string, worktreePath: string) => {
  if (!projectPath || !worktreePath) {
    return { success: false, error: "Project path and worktree path are required." };
  }

  const gitDirExists = existsSync(path.join(projectPath, ".git"));
  if (!gitDirExists) {
    return { success: false, error: "Git repository not found." };
  }

  const resolvedWorktreePath = resolveWorktreePath(projectPath, worktreePath);

  try {
    await execFileAsync("git", ["worktree", "remove", resolvedWorktreePath], { cwd: projectPath });
    return { success: true };
  } catch (error) {
    console.error(`Failed to remove worktree ${worktreePath}:`, error);
    const execError = error as ExecFileException & { stderr?: string };
    const errorMessage = execError?.stderr || execError?.message || "Unknown error removing worktree.";
    return {
      success: false,
      error: errorMessage,
    };
  }
});

ipcMain.handle("git/list-branches", async (_event, projectPath: string) => {
  if (!projectPath) {
    return [];
  }

  const gitDirExists = existsSync(path.join(projectPath, ".git"));
  if (!gitDirExists) {
    return [];
  }

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["for-each-ref", "--format=%(refname:short)", "refs/heads/"],
      { cwd: projectPath },
    );
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    console.warn(`Failed to list git branches for ${projectPath}:`, error);
    return [];
  }
});

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "worktrees"]);
const MAX_FILE_RESULTS = 250;

const normalizeRelativePath = (projectPath: string, entryPath: string) =>
  path.relative(projectPath, entryPath).split(path.sep).join("/");

const searchFilesInProject = async (projectPath: string, query: string): Promise<string[]> => {
  const normalizedQuery = query.trim().toLowerCase();
  const results: string[] = [];
  const stack: string[] = [projectPath];

  while (stack.length > 0 && results.length < MAX_FILE_RESULTS) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    let entries: import("node:fs").Dirent[];
    try {
      entries = await fsPromises.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      console.warn(`Unable to read directory ${currentDir}:`, error);
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      const relativePath = normalizeRelativePath(projectPath, entryPath);
      if (!relativePath || relativePath.startsWith("..")) {
        continue;
      }

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          stack.push(entryPath);
        }
        continue;
      }

      if (entry.isFile() || entry.isSymbolicLink()) {
        if (!normalizedQuery || relativePath.toLowerCase().includes(normalizedQuery)) {
          results.push(relativePath);
          if (results.length >= MAX_FILE_RESULTS) {
            break;
          }
        }
      }
    }
  }

  return results;
};

ipcMain.handle("project/search-files", async (_event, projectPath: string, query: string) => {
  if (!projectPath) {
    return [];
  }

  try {
    return await searchFilesInProject(path.resolve(projectPath), query ?? "");
  } catch (error) {
    console.error(`Failed to search files for ${projectPath}:`, error);
    return [];
  }
});

const copyFilesToWorktree = async (projectPath: string, worktreePath: string, files: string[]) => {
  const projectRoot = path.resolve(projectPath);
  const worktreeRoot = path.resolve(worktreePath);
  const copied: string[] = [];
  const errors: Array<{ file: string; message: string }> = [];

  for (const file of files) {
    const normalized = file.replace(/^[/\\]+/, "");
    const relativePath = normalized.split(path.sep).join("/");
    const sourcePath = path.resolve(projectRoot, relativePath);
    const targetPath = path.resolve(worktreeRoot, relativePath);

    if (!sourcePath.startsWith(projectRoot) || !targetPath.startsWith(worktreeRoot)) {
      errors.push({ file: relativePath, message: "Invalid file path." });
      continue;
    }

    try {
      const targetDir = path.dirname(targetPath);
      await fsPromises.mkdir(targetDir, { recursive: true });
      await fsPromises.copyFile(sourcePath, targetPath);
      copied.push(relativePath);
    } catch (error) {
      console.error(`Failed to copy ${relativePath}:`, error);
      errors.push({
        file: relativePath,
        message: error instanceof Error ? error.message : "Unknown copy error.",
      });
    }
  }

  return {
    success: errors.length === 0,
    copied,
    errors: errors.length > 0 ? errors : undefined,
  };
};

const resolveWorktreePath = (projectPath: string, worktreePath: string) => {
  const candidates: string[] = [];
  if (path.isAbsolute(worktreePath)) {
    candidates.push(worktreePath);
  } else {
    candidates.push(path.resolve(projectPath, worktreePath));
  }

  const normalized = worktreePath.replace(/^[/\\]+/, "");
  candidates.push(path.join(projectPath, "worktrees", normalized));

  const projectParent = path.resolve(projectPath, "..");
  const projectName = path.basename(projectPath);
  candidates.push(path.join(projectParent, ".worktrees", projectName, normalized));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
};

ipcMain.handle(
  "project/copy-files-to-worktree",
  async (_event, projectPath: string, worktreePath: string, files: string[]) => {
    if (!projectPath || !worktreePath || !Array.isArray(files) || files.length === 0) {
      return { success: false, copied: [], errors: [{ file: "", message: "Invalid copy parameters." }] };
    }

    try {
      return await copyFilesToWorktree(projectPath, worktreePath, files);
    } catch (error) {
      console.error(`Failed to copy files into worktree ${worktreePath}:`, error);
      return {
        success: false,
        copied: [],
        errors: [
          {
            file: "*",
            message: error instanceof Error ? error.message : "Unknown copy error.",
          },
        ],
      };
    }
  },
);

const LOOPBACK_PATTERN = /^127\.0\.0\.\d{1,3}$/;

const runPrivilegedIfconfig = async (args: string[]) => {
  if (process.platform !== "darwin") {
    return { success: false, output: "", error: "Environment networking is only supported on macOS." };
  }

  // Uses AppleScript to request elevation through the system dialog, keeping credentials out of JS.
  // Example: do shell script "ifconfig lo0 alias 127.0.0.2/32 up" with administrator privileges
  const command = `ifconfig ${args.map((part) => part.replace(/"/g, '\\"')).join(" ")}`;
  const appleScript = `do shell script "${command.replace(/"/g, '\\"')}" with administrator privileges`;

  return await new Promise<{ success: boolean; output: string; error?: string }>((resolve) => {
    const child = spawn("osascript", ["-e", appleScript]);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      resolve({ success: false, output: stdout, error: error.message });
    });

    child.on("close", (code) => {
      resolve({
        success: code === 0,
        output: stdout.trim(),
        error: code === 0 ? undefined : (stderr.trim() || "Command failed."),
      });
    });
  });
};

ipcMain.handle(
  "network/configure-environment-interface",
  async (_event, action: "add" | "remove", address: string) => {
    if (!LOOPBACK_PATTERN.test(address)) {
      return { success: false, error: "Invalid loopback address. Expected 127.0.0.x" };
    }

    const args =
      action === "add"
        ? ["lo0", "alias", `${address}/32`, "up"]
        : ["lo0", "-alias", address];

    try {
      return await runPrivilegedIfconfig(args);
    } catch (error) {
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Failed to configure environment interface.",
      };
    }
  },
);
