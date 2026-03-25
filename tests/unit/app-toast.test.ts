import assert from "node:assert/strict";
import test from "node:test";
import {
  createAppToast,
  DEFAULT_LOADING_SUCCESS_DURATION,
  type AppToastOptions,
  type StandardToastPayload,
} from "../../src/lib/app-toast.js";

interface LoadingEvent {
  type: "dismiss" | "show" | "success" | "update";
  id: string;
  message?: AppToastOptions;
}

const createHarness = () => {
  const loadingEvents: LoadingEvent[] = [];
  const standardPayloads: StandardToastPayload[] = [];
  const standardUpdates: StandardToastPayload[] = [];
  let loadingCount = 0;

  const toast = createAppToast({
    dismissLoading: (id) => loadingEvents.push({ type: "dismiss", id: String(id) }),
    showLoading: (message) => {
      loadingCount += 1;
      const id = `loading-${loadingCount}`;
      loadingEvents.push({ type: "show", id, message });
      return id;
    },
    showLoadingSuccess: (id, message) =>
      loadingEvents.push({ type: "success", id: String(id), message }),
    showStandard: (payload) => {
      standardPayloads.push(payload);
      const id = `standard-${standardPayloads.length}`;
      return {
        id,
        dismiss: () => undefined,
        update: (nextPayload) => standardUpdates.push(nextPayload),
      };
    },
    updateLoading: (id, message) =>
      loadingEvents.push({ type: "update", id: String(id), message }),
  });

  return { loadingEvents, standardPayloads, standardUpdates, toast };
};

test("error routes to the destructive standard toast with the shared duration", () => {
  const harness = createHarness();

  const controller = harness.toast.error({ title: "Failed to create workspace" });

  assert.equal(controller.id, "standard-1");
  assert.deepEqual(harness.standardPayloads[0], {
    title: "Failed to create workspace",
    variant: "destructive",
    duration: 5000,
  });
});

test("show preserves the info toast kind on the standard path", () => {
  const harness = createHarness();

  harness.toast.show({
    kind: "info",
    title: "Authentication required",
    description: "Showing cached branches.",
  });

  assert.deepEqual(harness.standardPayloads[0], {
    title: "Authentication required",
    description: "Showing cached branches.",
    variant: "default",
  });
});

test("loading update reuses the same loading toast id", () => {
  const harness = createHarness();

  const loadingToast = harness.toast.loading({ title: "Creating workspace..." });
  loadingToast.update({ title: "Finalizing workspace..." });

  assert.deepEqual(harness.loadingEvents, [
    { type: "show", id: "loading-1", message: { title: "Creating workspace..." } },
    {
      type: "update",
      id: "loading-1",
      message: { title: "Finalizing workspace..." },
    },
  ]);
});

test("loading success keeps the same toast id and applies the success duration", () => {
  const harness = createHarness();

  const loadingToast = harness.toast.loading({ title: "Creating workspace..." });
  loadingToast.success({ title: "Workspace created!" });

  assert.deepEqual(harness.loadingEvents[1], {
    type: "success",
    id: "loading-1",
    message: {
      title: "Workspace created!",
      duration: DEFAULT_LOADING_SUCCESS_DURATION,
    },
  });
});

test("loading error dismisses the loading toast and emits a standard error toast", () => {
  const harness = createHarness();

  const loadingToast = harness.toast.loading({ title: "Creating workspace..." });
  loadingToast.error({
    title: "Failed to create workspace",
    description: "branch already exists",
  });

  assert.deepEqual(harness.loadingEvents, [
    { type: "show", id: "loading-1", message: { title: "Creating workspace..." } },
    { type: "dismiss", id: "loading-1" },
  ]);
  assert.deepEqual(harness.standardPayloads[0], {
    title: "Failed to create workspace",
    description: "branch already exists",
    variant: "destructive",
    duration: 5000,
  });
});

test("controller update keeps the shared toast mapping", () => {
  const harness = createHarness();

  const controller = harness.toast.success({ title: "Saved" });
  controller.update({
    kind: "error",
    title: "Failed to save",
    description: "Disk is full",
  });

  assert.deepEqual(harness.standardUpdates[0], {
    title: "Failed to save",
    description: "Disk is full",
    variant: "destructive",
    duration: 5000,
  });
});
