import assert from "node:assert/strict";
import test from "node:test";
import { extractWorkspaceConsoleTitles } from "../workspace-console/session-lifecycle.js";

const escapeChar = String.fromCharCode(27);
const bellChar = String.fromCharCode(7);

test("extractWorkspaceConsoleTitles reads BEL-terminated terminal titles", () => {
  assert.deepEqual(
    extractWorkspaceConsoleTitles(`ready${escapeChar}]0;npm dev${bellChar}`),
    ["npm dev"],
  );
});

test("extractWorkspaceConsoleTitles reads ST-terminated terminal titles", () => {
  assert.deepEqual(
    extractWorkspaceConsoleTitles(`${escapeChar}]2;server${escapeChar}\\running`),
    ["server"],
  );
});

test("extractWorkspaceConsoleTitles ignores incomplete title sequences", () => {
  assert.deepEqual(extractWorkspaceConsoleTitles(`${escapeChar}]0;partial`), []);
});
