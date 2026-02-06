import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  type OpenDialogOptions,
  globalShortcut,
  screen,
} from "electron";
import updaterPackage from "electron-updater";
import type { UpdateInfo, UpdateCheckResult } from "electron-updater";

const { autoUpdater } = updaterPackage;
import path from "node:path";
import process from "node:process";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
import { promises as fsPromises } from "node:fs";
import { execFile, exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { ExecFileException } from "node:child_process";
import { initAnalytics, analytics, isAnalyticsEvent, trackEvent } from "./analytics.js";
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
let quickSidebarWindow: BrowserWindow | null = null;
const dismissedSessions = new Map<string, string>();
let cachedSessions: unknown[] = [];
const QUICK_SIDEBAR_HOTKEY = "Command+Shift+G";
const QUICK_SIDEBAR_WIDTH = 420;
const QUICK_SIDEBAR_MARGIN = 16;
let lastDownloadedVersion: string | null = null;
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
let updateCheckTimer: NodeJS.Timeout | null = null;
let updateCheckInFlight: Promise<UpdateCheckResult | null> | null = null;
const UPDATE_FEED_URL = (process.env.GALACTIC_UPDATE_URL ?? "").trim();
const isUpdateEnabled = () => UPDATE_FEED_URL.length > 0;

interface AppSettings {
  quickSidebarHotkeyEnabled: boolean;
}

const APP_SETTINGS_FILE = "settings.json";
const DEFAULT_APP_SETTINGS: AppSettings = {
  quickSidebarHotkeyEnabled: false,
};
let appSettings: AppSettings = { ...DEFAULT_APP_SETTINGS };

const getAppSettingsPath = () => path.join(app.getPath("userData"), APP_SETTINGS_FILE);

const loadAppSettings = async (): Promise<AppSettings> => {
  const settingsPath = getAppSettingsPath();
  if (!existsSync(settingsPath)) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  try {
    const raw = await fsPromises.readFile(settingsPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_APP_SETTINGS,
      quickSidebarHotkeyEnabled: Boolean(parsed.quickSidebarHotkeyEnabled),
    };
  } catch (error) {
    console.warn("Failed to read app settings:", error);
    return { ...DEFAULT_APP_SETTINGS };
  }
};

const saveAppSettings = async (settings: AppSettings) => {
  try {
    const settingsPath = getAppSettingsPath();
    await fsPromises.mkdir(path.dirname(settingsPath), { recursive: true });
    await fsPromises.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.warn("Failed to save app settings:", error);
  }
};

type UpdateEvent =
  | "available"
  | "downloaded"
  | "not-available"
  | "error";

const broadcastUpdateEvent = (status: UpdateEvent, payload: Record<string, unknown> = {}) => {
  const message = ["update/event", status, payload] as const;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(...message);
  }
  if (quickSidebarWindow && !quickSidebarWindow.isDestroyed()) {
    quickSidebarWindow.webContents.send(...message);
  }
};

const loadAppUrl = async (windowRef: BrowserWindow, hash: string) => {
  if (VITE_DEV_SERVER_URL) {
    await windowRef.loadURL(`${VITE_DEV_SERVER_URL}/#${hash}`);
    return;
  }
  await windowRef.loadFile(path.join(__dirname, "../dist/index.html"), { hash });
};

const getActiveDisplay = () => {
  const cursorPoint = screen.getCursorScreenPoint();
  return screen.getDisplayNearestPoint(cursorPoint) ?? screen.getPrimaryDisplay();
};

const getQuickSidebarHeight = (display = getActiveDisplay()) => {
  const { height } = display.workArea;
  return Math.max(360, height - QUICK_SIDEBAR_MARGIN * 2);
};

const positionQuickSidebar = (windowRef: BrowserWindow) => {
  const activeDisplay = getActiveDisplay();
  const { x, y } = activeDisplay.workArea;
  const height = getQuickSidebarHeight(activeDisplay);

  windowRef.setBounds({
    x: Math.round(x + QUICK_SIDEBAR_MARGIN),
    y: Math.round(y + QUICK_SIDEBAR_MARGIN),
    width: QUICK_SIDEBAR_WIDTH,
    height,
  });
};

const setQuickSidebarWorkspaceBehavior = (windowRef: BrowserWindow) => {
  if (process.platform !== "darwin") {
    return;
  }

  windowRef.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true,
  });
};

const withSuppressedWindowFocus = (targetWindow: BrowserWindow, action: () => void) => {
  if (process.platform !== "darwin") {
    action();
    return;
  }

  const focusableWindows = BrowserWindow.getAllWindows().filter((windowRef) => {
    if (windowRef.id === targetWindow.id || windowRef.isDestroyed()) {
      return false;
    }
    return windowRef.isVisible() && windowRef.isFocusable();
  });

  focusableWindows.forEach((windowRef) => windowRef.setFocusable(false));
  action();
  setTimeout(() => {
    focusableWindows.forEach((windowRef) => {
      if (!windowRef.isDestroyed()) {
        windowRef.setFocusable(true);
      }
    });
  }, 80);
};

const destroyQuickSidebarWindow = () => {
  if (quickSidebarWindow && !quickSidebarWindow.isDestroyed()) {
    quickSidebarWindow.destroy();
  }
  quickSidebarWindow = null;
};

const showQuickSidebar = (windowRef: BrowserWindow) => {
  setQuickSidebarWorkspaceBehavior(windowRef);
  windowRef.setAlwaysOnTop(true, "screen-saver");

  if (process.platform === "darwin") {
    // Cherry Studio pattern: show inactive to avoid space switching.
    withSuppressedWindowFocus(windowRef, () => {
      if (windowRef.isDestroyed()) {
        return;
      }
      windowRef.setFocusable(false);
      windowRef.showInactive();
      windowRef.setFocusable(true);
      windowRef.moveTop();
      setTimeout(() => {
        if (!windowRef.isDestroyed()) {
          windowRef.focus();
          windowRef.webContents.focus();
        }
      }, 20);
    });
    return;
  }

  windowRef.show();
  windowRef.moveTop();
  windowRef.focus();
};

const createQuickSidebarWindow = async () => {
  if (quickSidebarWindow) {
    return;
  }

  quickSidebarWindow = new BrowserWindow({
    width: QUICK_SIDEBAR_WIDTH,
    height: getQuickSidebarHeight(),
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    frame: false,
    transparent: false,
    hasShadow: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    type: "panel",
    backgroundColor: "#050510",
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    ...(process.platform === "darwin"
      ? {
          hiddenInMissionControl: true,
          acceptFirstMouse: true,
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  setQuickSidebarWorkspaceBehavior(quickSidebarWindow);

  quickSidebarWindow.on("blur", () => {
    if (process.platform !== "darwin" && quickSidebarWindow?.isVisible()) {
      destroyQuickSidebarWindow();
    }
  });

  quickSidebarWindow.on("closed", () => {
    quickSidebarWindow = null;
  });

  await loadAppUrl(quickSidebarWindow, "/quick-sidebar");
};

const toggleQuickSidebar = async (source: "shortcut" | "renderer" | "internal" = "internal") => {
  if (quickSidebarWindow?.isVisible()) {
    // If visible but not focused, refocus instead of closing
    if (!quickSidebarWindow.isFocused()) {
      quickSidebarWindow.focus();
      quickSidebarWindow.webContents.focus();
      return;
    }
    // If focused, close it
    destroyQuickSidebarWindow();
    analytics.quickLauncherToggled(false, source);
    return;
  }

  if (quickSidebarWindow) {
    destroyQuickSidebarWindow();
  }

  await createQuickSidebarWindow();
  if (!quickSidebarWindow) {
    return;
  }

  positionQuickSidebar(quickSidebarWindow);
  showQuickSidebar(quickSidebarWindow);
  analytics.quickLauncherToggled(true, source);
};

const applyQuickSidebarHotkeySetting = (enabled: boolean) => {
  if (enabled) {
    if (globalShortcut.isRegistered(QUICK_SIDEBAR_HOTKEY)) {
      return true;
    }

    const registered = globalShortcut.register(QUICK_SIDEBAR_HOTKEY, () => {
      void toggleQuickSidebar("shortcut").catch((error) => {
        console.error("Quick sidebar toggle failed:", error);
      });
    });

    if (!registered) {
      console.warn(`Failed to register hotkey ${QUICK_SIDEBAR_HOTKEY}`);
    }

    return registered;
  }

  if (globalShortcut.isRegistered(QUICK_SIDEBAR_HOTKEY)) {
    globalShortcut.unregister(QUICK_SIDEBAR_HOTKEY);
  }

  return true;
};

const setupAutoUpdater = () => {
  if (!app.isPackaged || !isUpdateEnabled()) {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.setFeedURL(UPDATE_FEED_URL);

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    broadcastUpdateEvent("available", { version: info.version });
  });

  autoUpdater.on("update-not-available", () => {
    broadcastUpdateEvent("not-available");
  });

  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    lastDownloadedVersion = info.version ?? null;
    broadcastUpdateEvent("downloaded", { version: info.version, releaseDate: info.releaseDate });
  });

  autoUpdater.on("error", (error: Error) => {
    console.error("Auto-updater error:", error);
    broadcastUpdateEvent("error", { message: error?.message ?? "Update failed" });
  });
};

const scheduleUpdateChecks = () => {
  if (!app.isPackaged || !isUpdateEnabled() || updateCheckTimer) {
    return;
  }

  updateCheckTimer = setInterval(() => {
    performUpdateCheck().catch((error: Error) => {
      console.warn("Update check failed:", error);
    });
  }, UPDATE_CHECK_INTERVAL_MS);
};

const performUpdateCheck = () => {
  if (!app.isPackaged || !isUpdateEnabled()) {
    return Promise.resolve(null);
  }

  if (updateCheckInFlight) {
    return updateCheckInFlight;
  }

  updateCheckInFlight = autoUpdater
    .checkForUpdates()
    .catch((error: Error) => {
      console.warn("Update check failed:", error);
      throw error;
    })
    .finally(() => {
      updateCheckInFlight = null;
    });

  return updateCheckInFlight;
};

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

ipcMain.handle("app/get-version", () => {
  return app.getVersion();
});

ipcMain.handle("quick-sidebar/toggle", async () => {
  await toggleQuickSidebar("renderer");
  return { visible: quickSidebarWindow?.isVisible() ?? false };
});

ipcMain.handle("quick-sidebar/hide", () => {
  if (quickSidebarWindow?.isVisible()) {
    analytics.quickLauncherToggled(false, "renderer");
  }
  if (quickSidebarWindow) {
    destroyQuickSidebarWindow();
  }
  return { hidden: true };
});

ipcMain.handle("settings/get-quick-sidebar-hotkey", () => {
  return appSettings.quickSidebarHotkeyEnabled;
});

ipcMain.handle("settings/set-quick-sidebar-hotkey", async (_event, enabled: boolean) => {
  const nextValue = Boolean(enabled);
  const applied = applyQuickSidebarHotkeySetting(nextValue);
  const resolvedValue = nextValue && applied;

  appSettings = { ...appSettings, quickSidebarHotkeyEnabled: resolvedValue };
  await saveAppSettings(appSettings);

  if (!applied && nextValue) {
    return { success: false, enabled: false, error: `Failed to register hotkey ${QUICK_SIDEBAR_HOTKEY}` };
  }

  return { success: true, enabled: resolvedValue };
});

// Session sync between windows - broadcast dismissal to all windows except sender
ipcMain.handle("session/broadcast-dismiss", (event, sessionId: string, signature: string) => {
  const senderWebContentsId = event.sender.id;
  dismissedSessions.set(sessionId, signature);

  // Broadcast to main window if it exists and isn't the sender
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents.id !== senderWebContentsId) {
    mainWindow.webContents.send("session/dismissed", sessionId, signature);
  }

  // Broadcast to quick sidebar if it exists and isn't the sender
  if (quickSidebarWindow && !quickSidebarWindow.isDestroyed() && quickSidebarWindow.webContents.id !== senderWebContentsId) {
    quickSidebarWindow.webContents.send("session/dismissed", sessionId, signature);
  }

  return { success: true };
});

ipcMain.handle("session/set-cache", (_event, sessions: unknown) => {
  cachedSessions = Array.isArray(sessions) ? sessions : [];
  return { success: true };
});

ipcMain.handle("session/get-cache", () => {
  return cachedSessions;
});

ipcMain.on("session/get-cache-sync", (event) => {
  event.returnValue = cachedSessions;
});

ipcMain.handle("session/get-dismissed", () => {
  return Array.from(dismissedSessions.entries());
});

ipcMain.on("session/get-dismissed-sync", (event) => {
  event.returnValue = Array.from(dismissedSessions.entries());
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

app.whenReady().then(async () => {
  // Initialize analytics and track app launch
   initAnalytics();
  analytics.appLaunched();
  setupAutoUpdater();
  if (app.isPackaged && isUpdateEnabled()) {
    performUpdateCheck().catch((error: Error) => {
      console.warn("Update check failed:", error);
    });
    scheduleUpdateChecks();
  }

  // Start the MCP server
  startMcpServer({ port: MCP_SERVER_PORT, tokenless: true });

  appSettings = await loadAppSettings();
  const hotkeyApplied = applyQuickSidebarHotkeySetting(appSettings.quickSidebarHotkeyEnabled);
  if (!hotkeyApplied && appSettings.quickSidebarHotkeyEnabled) {
    appSettings = { ...appSettings, quickSidebarHotkeyEnabled: false };
    await saveAppSettings(appSettings);
  }

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

app.on("before-quit", () => {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
  stopMcpServer();
});

app.on("will-quit", () => {
  globalShortcut.unregister(QUICK_SIDEBAR_HOTKEY);
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopMcpServer();
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
    // Just check for git repo existence, don't need branch
    return {
      isGitRepo: true,
    };
  } catch (error) {
    console.warn(`Failed to read git branch for ${projectPath}:`, error);
    return { isGitRepo: true };
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
      analytics.editorLaunched(editorName);
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
    analytics.workspaceCreated(branch);
    return { success: true, path: targetPath };
  } catch (error) {
    console.error(`Failed to create worktree for ${branch} at ${projectPath}:`, error);
    const execError = error as ExecFileException & { stderr?: string };
    const errorMessage = execError?.stderr || execError?.message || "Unknown error creating worktree.";
    analytics.gitFailed("worktree-add", errorMessage);
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
    analytics.workspaceDeleted(path.basename(resolvedWorktreePath));
    return { success: true };
  } catch (error) {
    console.error(`Failed to remove worktree ${worktreePath}:`, error);
    const execError = error as ExecFileException & { stderr?: string };
    const errorMessage = execError?.stderr || execError?.message || "Unknown error removing worktree.";
    analytics.gitFailed("worktree-remove", errorMessage);
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
    // Get local branches
    const { stdout: localStdout } = await execFileAsync(
      "git",
      ["for-each-ref", "--format=%(refname:short)", "refs/heads/"],
      { cwd: projectPath },
    );
    const localBranches = localStdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // Get remote branches and strip origin/ prefix
    const { stdout: remoteStdout } = await execFileAsync(
      "git",
      ["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin/"],
      { cwd: projectPath },
    );
    const remoteBranches = remoteStdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((branch) => branch.replace(/^origin\//, ""))
      .filter((branch) => branch !== "HEAD" && branch !== "origin" && branch !== "");

    // Merge and deduplicate (local branches take precedence)
    const allBranches = [...new Set([...localBranches, ...remoteBranches])];
    return allBranches.sort();
  } catch (error) {
    console.warn(`Failed to list git branches for ${projectPath}:`, error);
    return [];
  }
});

ipcMain.handle("git/get-worktrees", async (_event, projectPath: string) => {
  if (!projectPath) {
    return [];
  }

  const gitDirExists = existsSync(path.join(projectPath, ".git"));
  if (!gitDirExists) {
    return [];
  }

  try {
    const { stdout } = await execFileAsync("git", ["worktree", "list", "--porcelain"], {
      cwd: projectPath,
    });

    // Parse porcelain output
    // worktree /path/to/worktree
    // HEAD <sha>
    // branch refs/heads/branch-name
    //
    // worktree /path/to/main-repo
    // HEAD <sha>
    // branch refs/heads/main

    const worktrees: Array<{ path: string; branch: string; sha: string }> = [];
    const entries = stdout.split("\n\n");

    for (const entry of entries) {
      if (!entry.trim()) continue;

      const lines = entry.split("\n");
      let worktreePath = "";
      let branch = "";
      let sha = "";

      for (const line of lines) {
        if (line.startsWith("worktree ")) {
          worktreePath = line.substring(9).trim();
        } else if (line.startsWith("branch ")) {
          branch = line.substring(7).replace("refs/heads/", "").trim();
        } else if (line.startsWith("HEAD ")) {
          sha = line.substring(5).trim();
        }
      }

      if (worktreePath && branch) {
        worktrees.push({ path: worktreePath, branch, sha });
      }
    }

    return worktrees;
  } catch (error) {
    console.warn(`Failed to list worktrees for ${projectPath}:`, error);
    return [];
  }
});

ipcMain.handle("git/fetch-branches", async (_event, projectPath: string) => {
  if (!projectPath) {
    return { success: false, error: "Project path is required." };
  }

  const gitDirExists = existsSync(path.join(projectPath, ".git"));
  if (!gitDirExists) {
    return { success: false, error: "Git repository not found." };
  }

  try {
    await execFileAsync("git", ["fetch", "--all", "--prune"], { cwd: projectPath });
    return { success: true };
  } catch (error) {
    console.warn(`Failed to fetch branches for ${projectPath}:`, error);
    const execError = error as ExecFileException & { stderr?: string };
    const errorMessage = execError?.stderr || execError?.message || "Unknown error fetching branches.";
    analytics.gitFailed("fetch", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
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
      const result = await copyFilesToWorktree(projectPath, worktreePath, files);
      analytics.workspaceFilesCopied(result.copied.length, result.success);
      return result;
    } catch (error) {
      console.error(`Failed to copy files into worktree ${worktreePath}:`, error);
      analytics.workspaceFilesCopied(0, false);
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

import { createHash } from "node:crypto";

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

const WORKSPACES_CACHE_DIR = "galactic-workspaces";

interface WorkspaceEnvConfig {
  address?: string;
  envVars?: Record<string, string>;
}

const getWorkspacesCacheDir = () => {
  const cacheDir = path.join(app.getPath("userData"), WORKSPACES_CACHE_DIR);
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
};

const hashTargetPath = (targetPath: string): string => {
  return createHash("sha256").update(targetPath).digest("hex").slice(0, 16);
};

const getWorkspaceFilePath = (targetPath: string): string => {
  const hash = hashTargetPath(targetPath);
  const safeName = path.basename(targetPath).replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(getWorkspacesCacheDir(), `${safeName}-${hash}.code-workspace`);
};

const buildWorkspaceContent = (targetPath: string, envConfig: WorkspaceEnvConfig | null) => {
  const settings: Record<string, unknown> = {};

  if (envConfig && envConfig.address) {
    const envVars: Record<string, string> = { ...envConfig.envVars };

    if (Object.keys(envVars).length > 0) {
      settings["terminal.integrated.env.osx"] = envVars;
      settings["terminal.integrated.env.linux"] = envVars;
      settings["terminal.integrated.env.windows"] = envVars;
    }
  }

  return JSON.stringify(
    {
      folders: [{ path: targetPath }],
      settings,
    },
    null,
    2,
  );
};

ipcMain.handle(
  "workspace/write-code-workspace",
  async (
    _event,
    targetPath: string,
    envConfig: WorkspaceEnvConfig | null,
  ): Promise<{ success: boolean; workspacePath?: string; error?: string }> => {
    if (!targetPath) {
      return { success: false, error: "No target path provided." };
    }

    if (!existsSync(targetPath)) {
      return { success: false, error: "Target path does not exist." };
    }

    const workspacePath = getWorkspaceFilePath(targetPath);

    try {
      const content = buildWorkspaceContent(targetPath, envConfig);
      await fsPromises.writeFile(workspacePath, content, "utf-8");
      return { success: true, workspacePath };
    } catch (error) {
      console.error(`Failed to write workspace file:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to write workspace file.",
      };
    }
  },
);

ipcMain.handle(
  "workspace/get-code-workspace-path",
  async (_event, targetPath: string): Promise<{ exists: boolean; workspacePath: string }> => {
    const workspacePath = getWorkspaceFilePath(targetPath);
    return {
      exists: existsSync(workspacePath),
      workspacePath,
    };
  },
);
ipcMain.handle(
  "workspace/delete-code-workspace",
  async (_event, targetPath: string): Promise<{ success: boolean; error?: string }> => {
    if (!targetPath) {
      return { success: false, error: "No target path provided." };
    }

    const workspacePath = getWorkspaceFilePath(targetPath);

    try {
      if (existsSync(workspacePath)) {
        await fsPromises.unlink(workspacePath);
      }
      return { success: true };
    } catch (error) {
      console.error(`Failed to delete workspace file:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete workspace file.",
      };
    }
  },
);

ipcMain.handle("update/check", async () => {
  if (!app.isPackaged) {
    return { supported: false, message: "Updates are only available in packaged builds." };
  }
  if (!isUpdateEnabled()) {
    return { supported: false, message: "Update feed URL is not configured." };
  }

  try {
    const result = await performUpdateCheck();
    const version = result?.updateInfo?.version ?? null;
    return {
      supported: true,
      updateAvailable: Boolean(version && version !== app.getVersion()),
      version,
    };
  } catch (error) {
    console.warn("Update check failed:", error);
    return {
      supported: true,
      updateAvailable: false,
      error: error instanceof Error ? error.message : "Update check failed.",
    };
  }
});

ipcMain.handle("update/apply", async () => {
  if (!app.isPackaged) {
    return { success: false, error: "Updates are only available in packaged builds." };
  }
  if (!isUpdateEnabled()) {
    return { success: false, error: "Update feed URL is not configured." };
  }

  try {
    if (!lastDownloadedVersion) {
      return { success: false, error: "Update is not ready yet." };
    }
    if (lastDownloadedVersion) {
      analytics.updateCompleted(lastDownloadedVersion);
    }
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error) {
    console.error("Failed to apply update:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to install update." };
  }
});

import { updateMcpConfig, checkMcpConfig } from "./utils/config.js";
import {
  startMcpServer,
  stopMcpServer,
  isMcpServerRunning,
  restartMcpServer,
  getMcpServerUrl,
} from "./mcp-server.js";

const MCP_SERVER_PORT = 17890;

const THINKING_LOGGER_CONFIG = {
  type: "http",
  url: `http://localhost:${MCP_SERVER_PORT}`
} as const;

const MCP_SERVER_NAME = "galactic";

ipcMain.handle("mcp/check-installed", async (_event, tool: string) => {
  if (tool === "Cursor") {
    return await checkMcpConfig(path.join(os.homedir(), ".cursor", "mcp.json"), MCP_SERVER_NAME);
  }

  if (tool === "VSCode") {
    return await checkMcpConfig(path.join(os.homedir(), "Library", "Application Support", "Code", "User", "mcp.json"), MCP_SERVER_NAME);
  }

  if (tool === "Claude") {
    return await checkMcpConfig(path.join(os.homedir(), ".claude.json"), MCP_SERVER_NAME);
  }

  if (tool === "Codex") {
    return await checkMcpConfig(path.join(os.homedir(), ".codex", "config.toml"), MCP_SERVER_NAME);
  }

  return false;
});

ipcMain.handle("mcp/install", async (_event, tool: string) => {
  let result: { success: boolean; error?: string };

  if (tool === "Cursor") {
    result = await updateMcpConfig(
      path.join(os.homedir(), ".cursor", "mcp.json"),
      MCP_SERVER_NAME,
      THINKING_LOGGER_CONFIG
    );
  } else if (tool === "VSCode") {
    result = await updateMcpConfig(
      path.join(os.homedir(), "Library", "Application Support", "Code", "User", "mcp.json"),
      MCP_SERVER_NAME,
      THINKING_LOGGER_CONFIG
    );
  } else if (tool === "Claude") {
    result = await updateMcpConfig(
      path.join(os.homedir(), ".claude.json"),
      MCP_SERVER_NAME,
      THINKING_LOGGER_CONFIG
    );
  } else if (tool === "Codex") {
    result = await updateMcpConfig(
      path.join(os.homedir(), ".codex", "config.toml"),
      MCP_SERVER_NAME,
      THINKING_LOGGER_CONFIG
    );
  } else {
    return { success: false, error: "Tool not supported yet." };
  }

  if (result.success) {
    analytics.mcpConnected(tool);
  }

  return result;
});

ipcMain.handle("mcp/server-status", () => {
  return {
    running: isMcpServerRunning(),
    url: getMcpServerUrl(MCP_SERVER_PORT),
    port: MCP_SERVER_PORT,
  };
});

ipcMain.handle("mcp/restart-server", () => {
  restartMcpServer({ port: MCP_SERVER_PORT, tokenless: true });
  return { success: true };
});

ipcMain.handle(
  "analytics/track-event",
  (_event, eventName: string, payload?: Record<string, string | number | boolean>) => {
    if (!isAnalyticsEvent(eventName)) {
      console.warn(`[Analytics] Ignoring unknown event: ${eventName}`);
      return { success: false };
    }
    trackEvent(eventName, payload);
    return { success: true };
  },
);

// Analytics tracking from renderer
ipcMain.handle("analytics/track-environment-created", (_event, address: string) => {
  analytics.environmentCreated(address);
  return { success: true };
});
