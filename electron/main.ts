import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  type OpenDialogOptions,
  screen,
  shell,
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
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { ExecFileException } from "node:child_process";
import { initAnalytics, shutdownAnalytics, analytics, isAnalyticsEvent, trackEvent } from "./analytics.js";
import { createEditorLaunchService, parseEditorName } from "./editor-launch/service.js";
import type { SupportedEditorName } from "./editor-launch/types.js";
import { registerEditorLaunchIpc } from "./ipc/register-editor-launch.js";
import { registerGitWorktreeIpc } from "./ipc/register-git-worktree.js";
import { MCP_SERVER_PORT, registerMcpIpc } from "./ipc/register-mcp.js";
import { registerProjectSyncIpc } from "./ipc/register-project-sync.js";
import { registerWorkspaceIsolationIpc } from "./ipc/register-workspace-isolation.js";
import {
  startMcpServer,
  stopMcpServer,
  isMcpServerRunning,
  restartMcpServer,
  getMcpServerUrl,
} from "./mcp-server.js";
import {
  getGalacticUpdateUrl,
  getPostHogHost,
  getPostHogProjectKey,
  getPostHogSessionReplayEnabled,
} from "./release-config.js";
import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
} from "./utils/app-settings.js";
import { createMacNotifierService } from "./mac-notifier/service.js";
import { maybeAuthorizeEventNotificationsOnLaunch } from "./utils/event-notification-authorization.js";
import { getFinishedSessionNotifications } from "./utils/session-notifications.js";
import { syncFinishedSessionNotificationState } from "./utils/session-notification-sync.js";
import { fetchGitBranchesWithReason } from "./utils/git-fetch-branches.js";
import { listGitBranches } from "./utils/git-list-branches.js";
import { isWorktreeAlreadyRemovedError } from "./utils/git-worktree-remove.js";
import { WorkspaceIsolationManager } from "./workspace-isolation/manager.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

const VITE_DEV_SERVER_URL =
  process.env.ELECTRON_START_URL || process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;
let quickSidebarWindow: BrowserWindow | null = null;
const dismissedSessions = new Map<string, string>();
let cachedSessions: unknown[] = [];
let sessionCachePrimed = false;
let lastPreferredEditor: SupportedEditorName = "Cursor";
const notifiedFinishedSessionSignatures = new Set<string>();
const QUICK_SIDEBAR_HOTKEY = "Command+Shift+G";
const QUICK_SIDEBAR_WIDTH = 420;
const QUICK_SIDEBAR_MARGIN = 16;
let lastDownloadedVersion: string | null = null;
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
let updateCheckTimer: NodeJS.Timeout | null = null;
let updateCheckInFlight: Promise<UpdateCheckResult | null> | null = null;
const isUpdateEnabled = () => getGalacticUpdateUrl().length > 0;
const editorLaunchService = createEditorLaunchService();
const workspaceIsolationManager = new WorkspaceIsolationManager(app.getPath("userData"), process.platform);
const macNotifierService = createMacNotifierService({
  isPackaged: app.isPackaged,
  resourcesPath: process.resourcesPath,
});
const macNotificationActionText: Record<SupportedEditorName, string> = {
  Cursor: "Open in Cursor",
  VSCode: "Open in VS Code",
};

interface SessionCacheSnapshot {
  sessions: unknown[];
  preferredEditor?: string;
}

interface EventNotificationStatus {
  authorizationStatus: "authorized" | "denied" | "not-determined" | "unsupported";
  enabled: boolean;
  message?: string;
  supported: boolean;
}

const APP_SETTINGS_FILE = "settings.json";
let appSettings: AppSettings = { ...DEFAULT_APP_SETTINGS };

const getAppSettingsPath = () => path.join(app.getPath("userData"), APP_SETTINGS_FILE);
const persistAppSettings = async () => saveAppSettings(getAppSettingsPath(), appSettings);

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
  const updateFeedUrl = getGalacticUpdateUrl();
  if (!app.isPackaged || !updateFeedUrl) {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.setFeedURL(updateFeedUrl);

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

const normalizeSessionCacheSnapshot = (payload: unknown): SessionCacheSnapshot => {
  if (Array.isArray(payload)) {
    return { sessions: payload };
  }

  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    return {
      sessions: Array.isArray(value.sessions) ? value.sessions : [],
      preferredEditor: typeof value.preferredEditor === "string" ? value.preferredEditor : undefined,
    };
  }

  return { sessions: [] };
};

const getPreferredEditorFromSnapshot = (snapshot: SessionCacheSnapshot): SupportedEditorName => {
  const parsedEditor = snapshot.preferredEditor ? parseEditorName(snapshot.preferredEditor) : null;
  if (parsedEditor) {
    lastPreferredEditor = parsedEditor;
  }

  return lastPreferredEditor;
};

const getWorkspaceOpenPath = (targetPath: string): string => {
  const workspacePath = getWorkspaceFilePath(targetPath);
  return existsSync(workspacePath) ? workspacePath : targetPath;
};

const getMacNotifierLaunchTargets = async (
  workspacePath: string | undefined,
  preferredEditor: SupportedEditorName,
) => {
  if (!workspacePath) {
    return [];
  }

  const targetPath = getWorkspaceOpenPath(workspacePath);
  if (!existsSync(targetPath)) {
    console.warn(`Notification workspace path does not exist: ${targetPath}`);
    return [];
  }

  return await editorLaunchService.resolveMacLaunchTargets(preferredEditor, targetPath);
};

const getEventNotificationStatus = async (): Promise<EventNotificationStatus> => {
  const status = await macNotifierService.getStatus();
  return {
    authorizationStatus: status.authorizationStatus,
    enabled: appSettings.eventNotificationsEnabled,
    message: status.message,
    supported: status.supported,
  };
};

const showFinishedSessionNotification = (
  notificationPayload: ReturnType<typeof getFinishedSessionNotifications>[number],
  preferredEditor: SupportedEditorName,
) => {
  if (process.platform !== "darwin" || !app.isPackaged) {
    return;
  }

  void (async () => {
    const launchTargets = await getMacNotifierLaunchTargets(
      notificationPayload.workspacePath,
      preferredEditor,
    );
    const result = await macNotifierService.showNotification({
      actionText: launchTargets[0] ? macNotificationActionText[launchTargets[0].editor] : undefined,
      body: notificationPayload.body,
      launchTargets,
      signature: notificationPayload.signature,
      subtitle: notificationPayload.subtitle,
      title: notificationPayload.title,
    });

    if (!result.success) {
      console.warn(`Failed to show macOS helper notification: ${result.error ?? "Unknown error"}`);
    }
  })();
};

const syncFinishedSessionNotifications = (payload: unknown) => {
  const snapshot = normalizeSessionCacheSnapshot(payload);
  const preferredEditor = getPreferredEditorFromSnapshot(snapshot);
  const result = syncFinishedSessionNotificationState({
    nextSessions: snapshot.sessions,
    notificationsEnabled: appSettings.eventNotificationsEnabled,
    notifiedSignatures: notifiedFinishedSessionSignatures,
    preferredEditor,
    previousSessions: cachedSessions,
    sessionCachePrimed,
  });

  cachedSessions = result.nextCachedSessions;
  sessionCachePrimed = result.nextSessionCachePrimed;
  result.signaturesToRecord.forEach((signature) => {
    notifiedFinishedSessionSignatures.add(signature);
  });
  result.notificationsToShow.forEach((notificationPayload) => {
    showFinishedSessionNotification(notificationPayload, preferredEditor);
  });
};

ipcMain.handle("ping", () => {
  return "pong";
});

ipcMain.handle("app/get-version", () => {
  return app.getVersion();
});

ipcMain.handle("analytics/get-posthog-session-recording-config", () => {
  const projectKey = getPostHogProjectKey();
  const host = getPostHogHost();

  return {
    enabled: getPostHogSessionReplayEnabled() && projectKey.length > 0,
    host,
    projectKey,
  };
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

ipcMain.handle("settings/get-event-notification-status", async () => {
  return await getEventNotificationStatus();
});

ipcMain.handle("settings/set-quick-sidebar-hotkey", async (_event, enabled: boolean) => {
  const nextValue = Boolean(enabled);
  const applied = applyQuickSidebarHotkeySetting(nextValue);
  const resolvedValue = nextValue && applied;

  appSettings = { ...appSettings, quickSidebarHotkeyEnabled: resolvedValue };
  await persistAppSettings();

  if (!applied && nextValue) {
    return { success: false, enabled: false, error: `Failed to register hotkey ${QUICK_SIDEBAR_HOTKEY}` };
  }

  return { success: true, enabled: resolvedValue };
});

ipcMain.handle("settings/set-event-notifications", async (_event, enabled: boolean) => {
  const resolvedValue = Boolean(enabled);
  if (!resolvedValue) {
    appSettings = { ...appSettings, eventNotificationsEnabled: false };
    await persistAppSettings();
    return { success: true, enabled: false };
  }

  const authorizeResult = await macNotifierService.authorizeNotifications();
  if (!authorizeResult.success) {
    return {
      success: false,
      enabled: false,
      error: authorizeResult.message ?? "Unable to enable event notifications.",
    };
  }

  appSettings = { ...appSettings, eventNotificationsEnabled: true };
  await persistAppSettings();
  return { success: true, enabled: true };
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
  syncFinishedSessionNotifications(sessions);
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

  appSettings = await loadAppSettings(getAppSettingsPath());
  const hotkeyApplied = applyQuickSidebarHotkeySetting(appSettings.quickSidebarHotkeyEnabled);
  if (!hotkeyApplied && appSettings.quickSidebarHotkeyEnabled) {
    appSettings = { ...appSettings, quickSidebarHotkeyEnabled: false };
    await persistAppSettings();
  }
  try {
    await workspaceIsolationManager.start(appSettings.workspaceIsolationShellHooksEnabled);
    const shellHookStatus = workspaceIsolationManager.getShellHookStatus();
    if (shellHookStatus.enabled !== appSettings.workspaceIsolationShellHooksEnabled) {
      appSettings = {
        ...appSettings,
        workspaceIsolationShellHooksEnabled: shellHookStatus.enabled,
      };
      await persistAppSettings();
    }
  } catch (error) {
    console.error("Failed to start Workspace Isolation services:", error);
  }

  createWindow().catch((error) => {
    console.error("Failed to create window:", error);
    app.quit();
  });

  void maybeAuthorizeEventNotificationsOnLaunch({
    isPackaged: app.isPackaged,
    logWarning: (message) => {
      console.warn(message);
    },
    notificationsEnabled: appSettings.eventNotificationsEnabled,
    notifier: macNotifierService,
    platform: process.platform,
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

let analyticsShutdownStarted = false;
app.on("before-quit", (event) => {
  if (analyticsShutdownStarted) return;

  analyticsShutdownStarted = true;
  event.preventDefault();
  shutdownAnalytics()
    .catch((error: Error) => {
      console.warn("[Analytics] Failed to shut down cleanly:", error);
    })
    .finally(() => app.quit());
});

app.on("before-quit", () => {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
  stopMcpServer();
  void workspaceIsolationManager.stop();
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
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      GIT_LFS_SKIP_SMUDGE: "1",
      ...(process.platform === "darwin" && {
        PATH: [process.env.PATH ?? "", "/opt/homebrew/bin", "/usr/local/bin"]
          .filter(Boolean)
          .join(path.delimiter),
      }),
    };

    await execFileAsync("git", ["worktree", "remove", resolvedWorktreePath], { cwd: projectPath, env });
    analytics.workspaceDeleted(path.basename(resolvedWorktreePath));
    return { success: true };
  } catch (error) {
    console.error(`Failed to remove worktree ${worktreePath}:`, error);
    const execError = error as ExecFileException & { stderr?: string };
    const errorMessage = execError?.stderr || execError?.message || "Unknown error removing worktree.";
    if (isWorktreeAlreadyRemovedError(errorMessage)) {
      analytics.workspaceDeleted(path.basename(resolvedWorktreePath));
      return { success: true, alreadyRemoved: true };
    }
    analytics.gitFailed("worktree-remove", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
});

ipcMain.handle("git/list-branches", async (_event, projectPath: string, options?: { scope?: "all" | "local" }) => {
  if (!projectPath) {
    return [];
  }

  const gitDirExists = existsSync(path.join(projectPath, ".git"));
  if (!gitDirExists) {
    return [];
  }

  try {
    return await listGitBranches(projectPath, options);
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

  const result = await fetchGitBranchesWithReason(projectPath);
  if (!result.success) {
    console.warn(`Failed to fetch branches for ${projectPath}:`, result.error);
    analytics.gitFailed("fetch", result.error ?? "Unknown error fetching branches.");
  }
  return result;
});

registerEditorLaunchIpc({
  ipcMain,
  editorLaunched: (editor) => analytics.editorLaunched(editor),
  editorLaunchService,
});

registerGitWorktreeIpc({
  ipcMain,
  workspaceCreated: (branch) => analytics.workspaceCreated(branch),
  gitFailed: (operation, error) => analytics.gitFailed(operation, error),
});

registerProjectSyncIpc({
  ipcMain,
  workspaceFilesCopied: (count, success) => analytics.workspaceFilesCopied(count, success),
});

registerMcpIpc({
  ipcMain,
  mcpConnected: (tool) => analytics.mcpConnected(tool),
});

registerWorkspaceIsolationIpc({
  ipcMain,
  getStacks: () => workspaceIsolationManager.getStacks(),
  getProjectTopologies: () => workspaceIsolationManager.getProjectTopologies(),
  getIntroSeen: () => appSettings.workspaceIsolationIntroSeen,
  saveProjectTopology: (input) =>
    workspaceIsolationManager.saveProjectTopology(input),
  deleteProjectTopology: (topologyId) =>
    workspaceIsolationManager.deleteProjectTopology(topologyId),
  enableWorkspace: (input) => workspaceIsolationManager.enableWorkspace(input),
  disableWorkspace: (workspaceRootPath) =>
    workspaceIsolationManager.disableWorkspace(workspaceRootPath),
  getShellHookStatus: () => workspaceIsolationManager.getShellHookStatus(),
  getProxyStatus: () => workspaceIsolationManager.getProxyStatus(),
  markIntroSeen: async () => {
    appSettings = {
      ...appSettings,
      workspaceIsolationIntroSeen: true,
    };
    await persistAppSettings();
    return true;
  },
  setShellHooksEnabled: async (enabled) => {
    const status = await workspaceIsolationManager.setShellHooksEnabled(enabled);
    appSettings = {
      ...appSettings,
      workspaceIsolationShellHooksEnabled: status.enabled,
    };
    await persistAppSettings();
    return status;
  },
});

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
