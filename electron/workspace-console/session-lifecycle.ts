import type {
  WorkspaceConsoleSessionSummary,
  WorkspaceConsoleStatus,
} from "./types.js";

const escapeChar = String.fromCharCode(27);
const bellChar = String.fromCharCode(7);
const stringTerminator = `${escapeChar}\\`;
const titlePrefixes = [`${escapeChar}]0;`, `${escapeChar}]2;`];

export const createWorkspaceConsoleSummary = (
  sessionId: string,
  workspacePath: string,
  label: string,
  cwd: string,
): WorkspaceConsoleSessionSummary => ({
  sessionId,
  workspacePath,
  workspaceLabel: label,
  cwd,
  status: "starting",
  title: label,
  createdAt: Date.now(),
});

const getFirstTerminatorIndex = (data: string, startIndex: number): number => {
  const bellIndex = data.indexOf(bellChar, startIndex);
  const stIndex = data.indexOf(stringTerminator, startIndex);
  if (bellIndex === -1) return stIndex;
  if (stIndex === -1) return bellIndex;
  return Math.min(bellIndex, stIndex);
};

const findNextTitlePrefix = (
  data: string,
  startIndex: number,
): { index: number; prefix: string } | null => {
  const matches = titlePrefixes
    .map((prefix) => ({ index: data.indexOf(prefix, startIndex), prefix }))
    .filter((match) => match.index >= 0)
    .sort((a, b) => a.index - b.index);
  return matches[0] ?? null;
};

export const extractWorkspaceConsoleTitles = (data: string): string[] => {
  const titles: string[] = [];
  let searchIndex = 0;
  let match = findNextTitlePrefix(data, searchIndex);

  while (match) {
    const titleStart = match.index + match.prefix.length;
    const titleEnd = getFirstTerminatorIndex(data, titleStart);
    if (titleEnd === -1) break;

    const title = data.slice(titleStart, titleEnd);
    if (title) titles.push(title);
    searchIndex = titleEnd + 1;
    match = findNextTitlePrefix(data, searchIndex);
  }

  return titles;
};

export const isLiveWorkspaceConsoleStatus = (
  status: WorkspaceConsoleStatus,
): boolean => status === "running" || status === "starting";

export const toWorkspaceConsoleErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Terminal error.";
