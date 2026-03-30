import { execFile, spawn } from "node:child_process";
import { promises as fsPromises } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import type { ChildProcess, SpawnOptions } from "node:child_process";
import type {
  AuthorizeMacNotificationResult,
  MacNotifierAuthorizationStatus,
  MacNotifierPayload,
  MacNotifierStatus,
  ShowMacNotificationResult,
} from "./types.js";

type SpawnProcess = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;
type ExecFileAsync = (command: string, args: string[]) => Promise<unknown>;
type ReadFile = (filePath: string, encoding: BufferEncoding) => Promise<string>;
type RemovePath = (filePath: string) => Promise<void>;
type MakeTempDir = (prefix: string) => Promise<string>;

interface HelperCommandResult {
  authorizationStatus: Exclude<MacNotifierAuthorizationStatus, "unsupported">;
  message?: string;
}

export interface MacNotifierService {
  getHelperAppPath: () => string;
  authorizeNotifications: () => Promise<AuthorizeMacNotificationResult>;
  getStatus: () => Promise<MacNotifierStatus>;
  showNotification: (payload: MacNotifierPayload) => Promise<ShowMacNotificationResult>;
}

export interface MacNotifierServiceDeps {
  execFileAsync?: ExecFileAsync;
  isPackaged?: boolean;
  makeTempDir?: MakeTempDir;
  pathExists?: (filePath: string) => boolean;
  readFile?: ReadFile;
  removePath?: RemovePath;
  resourcesPath?: string;
  spawnProcess?: SpawnProcess;
}

const HELPER_APP_NAME = "Galactic Notifier.app";
const OPEN_COMMAND = "/usr/bin/open";
const RESULT_FILE_NAME = "result.json";
const TEMP_DIRECTORY_PREFIX = "galactic-notifier-";
const PACKAGED_ONLY_MESSAGE = "Event notifications are available only in packaged Galactic on macOS.";
const HELPER_STATUS_FLAG = "--status";
const HELPER_AUTHORIZE_FLAG = "--authorize";
const HELPER_NOTIFY_FLAG = "--notify";
const HELPER_RESULT_FILE_FLAG = "--result-file";
const defaultExecFileAsync = promisify(execFile);

export const encodeMacNotifierPayload = (payload: MacNotifierPayload): string =>
  Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");

export const getPackagedMacNotifierAppPath = (resourcesPath: string): string =>
  path.resolve(resourcesPath, `../Library/LoginItems/${HELPER_APP_NAME}`);

const buildUnsupportedStatus = (message = PACKAGED_ONLY_MESSAGE): MacNotifierStatus => ({
  authorizationStatus: "unsupported",
  message,
  supported: false,
});

const isSupportedAuthorizationStatus = (
  value: unknown,
): value is Exclude<MacNotifierAuthorizationStatus, "unsupported"> =>
  value === "authorized" || value === "denied" || value === "not-determined";

const parseHelperCommandResult = (content: string): HelperCommandResult | null => {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const authorizationStatus = parsed.authorizationStatus;
    if (!isSupportedAuthorizationStatus(authorizationStatus)) {
      return null;
    }

    return {
      authorizationStatus,
      message: typeof parsed.message === "string" ? parsed.message : undefined,
    };
  } catch {
    return null;
  }
};

export const createMacNotifierService = (
  deps: MacNotifierServiceDeps = {},
): MacNotifierService => {
  const execFileAsync = deps.execFileAsync ?? defaultExecFileAsync;
  const isPackaged = deps.isPackaged ?? false;
  const makeTempDir = deps.makeTempDir ?? ((prefix: string) => fsPromises.mkdtemp(prefix));
  const pathExists = deps.pathExists ?? existsSync;
  const readFile = deps.readFile ?? ((filePath, encoding) => fsPromises.readFile(filePath, encoding));
  const removePath = deps.removePath ?? ((filePath) => fsPromises.rm(filePath, { force: true, recursive: true }));
  const resourcesPath = deps.resourcesPath ?? process.resourcesPath;
  const spawnProcess = deps.spawnProcess ?? spawn;

  const getHelperAppPath = (): string => getPackagedMacNotifierAppPath(resourcesPath);

  const runHelperMode = async (
    modeFlag: typeof HELPER_STATUS_FLAG | typeof HELPER_AUTHORIZE_FLAG,
  ): Promise<MacNotifierStatus> => {
    if (!isPackaged) {
      return buildUnsupportedStatus();
    }

    const helperAppPath = getHelperAppPath();
    if (!pathExists(helperAppPath)) {
      return buildUnsupportedStatus(`Mac notifier helper not found at ${helperAppPath}`);
    }

    const tempDirectory = await makeTempDir(path.join(os.tmpdir(), TEMP_DIRECTORY_PREFIX));
    const resultFilePath = path.join(tempDirectory, RESULT_FILE_NAME);
    try {
      await execFileAsync(OPEN_COMMAND, [
        "-W",
        "-n",
        "-a",
        helperAppPath,
        "--args",
        modeFlag,
        HELPER_RESULT_FILE_FLAG,
        resultFilePath,
      ]);
      const content = await readFile(resultFilePath, "utf-8");
      const parsedResult = parseHelperCommandResult(content);
      if (!parsedResult) {
        return buildUnsupportedStatus("Mac notifier helper returned an invalid response.");
      }

      return {
        authorizationStatus: parsedResult.authorizationStatus,
        message: parsedResult.message,
        supported: true,
      };
    } catch (error) {
      return buildUnsupportedStatus(error instanceof Error ? error.message : String(error));
    } finally {
      await removePath(tempDirectory);
    }
  };

  return {
    getHelperAppPath,
    authorizeNotifications: async (): Promise<AuthorizeMacNotificationResult> => {
      const status = await runHelperMode(HELPER_AUTHORIZE_FLAG);
      return {
        ...status,
        success: status.supported && status.authorizationStatus === "authorized",
      };
    },
    getStatus: async (): Promise<MacNotifierStatus> => await runHelperMode(HELPER_STATUS_FLAG),
    showNotification: async (payload: MacNotifierPayload): Promise<ShowMacNotificationResult> => {
      const status = await runHelperMode(HELPER_STATUS_FLAG);
      if (!status.supported || status.authorizationStatus !== "authorized") {
        return {
          error: status.message ?? "Mac notifier helper is unavailable.",
          supported: status.supported,
          success: false,
        };
      }

      const helperAppPath = getHelperAppPath();
      if (!pathExists(helperAppPath)) {
        return {
          success: false,
          error: `Mac notifier helper not found at ${helperAppPath}`,
          supported: false,
        };
      }

      return await new Promise<ShowMacNotificationResult>((resolve) => {
        const child = spawnProcess(
          OPEN_COMMAND,
          [
            "-g",
            "-n",
            "-a",
            helperAppPath,
            "--args",
            HELPER_NOTIFY_FLAG,
            "--payload",
            encodeMacNotifierPayload(payload),
          ],
          {
            detached: true,
            stdio: "ignore",
          },
        );

        child.once("error", (error) => {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            supported: true,
          });
        });

        child.once("spawn", () => {
          child.unref();
          resolve({ success: true, supported: true });
        });
      });
    },
  };
};
