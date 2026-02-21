import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldHideBranchSearchOnBlur,
  shouldLoadBranchesOnFocus,
  shouldResetBranchSearchSession,
  shouldShowBranchSearchResults,
} from "../../src/lib/branch-search-focus.js";

test("loads branches only on first focus when not creating a workspace", () => {
  assert.equal(
    shouldLoadBranchesOnFocus({
      hasFetchedBranchesThisOpen: false,
      isCreatingWorkspace: false,
    }),
    true,
  );
});

test("does not load branches on refocus after the first successful focus", () => {
  assert.equal(
    shouldLoadBranchesOnFocus({
      hasFetchedBranchesThisOpen: true,
      isCreatingWorkspace: false,
    }),
    false,
  );
});

test("does not load branches when workspace creation is in progress", () => {
  assert.equal(
    shouldLoadBranchesOnFocus({
      hasFetchedBranchesThisOpen: false,
      isCreatingWorkspace: true,
    }),
    false,
  );
});

test("does not show branch results before the search input is focused", () => {
  assert.equal(
    shouldShowBranchSearchResults({
      branchSearchActive: false,
      isLoadingBranches: false,
    }),
    false,
  );
});

test("shows branch results while the search input is focused", () => {
  assert.equal(
    shouldShowBranchSearchResults({
      branchSearchActive: true,
      isLoadingBranches: false,
    }),
    true,
  );
});

test("shows branch results while loading even if the search input blurs", () => {
  assert.equal(
    shouldShowBranchSearchResults({
      branchSearchActive: false,
      isLoadingBranches: true,
    }),
    true,
  );
});

test("resets branch search session when dialog opens", () => {
  assert.equal(
    shouldResetBranchSearchSession({
      open: true,
    }),
    true,
  );
});

test("does not reset branch search session when dialog closes", () => {
  assert.equal(
    shouldResetBranchSearchSession({
      open: false,
    }),
    false,
  );
});

test("keeps branch search results on blur while dialog is open", () => {
  assert.equal(
    shouldHideBranchSearchOnBlur({
      isDialogOpen: true,
    }),
    false,
  );
});

test("keeps branch search results during close transition blur", () => {
  assert.equal(
    shouldHideBranchSearchOnBlur({
      isDialogOpen: false,
    }),
    false,
  );
});
