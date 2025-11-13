import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

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
  const dialogOptions = { properties: ["openDirectory", "createDirectory"] as const };
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

  try {
    await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: projectPath,
    });
  } catch (error) {
    console.warn(`Git repo check failed for ${projectPath}:`, error);
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

