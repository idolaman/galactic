import assert from "node:assert/strict";
import test from "node:test";
import { copyTextToClipboard } from "../../src/services/clipboard.js";

test("copyTextToClipboard writes text when a clipboard writer is available", async () => {
  let copiedText = "";

  const copied = await copyTextToClipboard("api.root.shop.localhost:1355", {
    writeText: async (text) => {
      copiedText = text;
    },
  });

  assert.equal(copied, true);
  assert.equal(copiedText, "api.root.shop.localhost:1355");
});

test("copyTextToClipboard returns false when writing fails", async () => {
  const copied = await copyTextToClipboard("api.root.shop.localhost:1355", {
    writeText: async () => {
      throw new Error("clipboard unavailable");
    },
  });

  assert.equal(copied, false);
});

test("copyTextToClipboard returns false when no clipboard writer exists", async () => {
  const copied = await copyTextToClipboard("api.root.shop.localhost:1355");

  assert.equal(copied, false);
});
