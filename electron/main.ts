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
import { existsSync } from "node:fs";
import { execFile, exec } from "node:child_process";
import { promisify } from "node:util";

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
