import assert from "node:assert/strict";
import test from "node:test";
import {
  HOSTNAME_SEGMENT_MAX_LENGTH,
  applyDerivedServiceFields,
  buildServiceStackHostname,
  buildServiceStackUrl,
} from "../../src/lib/service-stack-routing.js";

test("applyDerivedServiceFields keeps blank draft paths empty and derives unique last-segment names", () => {
  const [app, api, servicesApi] = applyDerivedServiceFields([
    {
      id: "root",
      name: "",
      slug: "",
      relativePath: "",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
    {
      id: "api",
      name: "",
      slug: "",
      relativePath: "app/api",
      port: 4311,
      createdAt: 1,
      connections: [],
    },
    {
      id: "services-api",
      name: "",
      slug: "",
      relativePath: "services/api",
      port: 4312,
      createdAt: 1,
      connections: [],
    },
  ]);

  assert.equal(app?.name, "App");
  assert.equal(app?.slug, "app");
  assert.equal(app?.relativePath, "");
  assert.equal(api?.name, "api");
  assert.equal(api?.slug, "api");
  assert.equal(api?.relativePath, "app/api");
  assert.match(servicesApi?.name ?? "", /^api-[a-z]{5}$/);
  assert.match(servicesApi?.slug ?? "", /^api-[a-z]{5}$/);
  assert.equal(servicesApi?.relativePath, "services/api");
});

test("buildServiceStackHostname includes the workspace branch and project", () => {
  const [service] = applyDerivedServiceFields([
    {
      id: "api",
      name: "",
      slug: "",
      relativePath: "apps/api",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
  ]);

  assert.equal(
    buildServiceStackHostname(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      service,
    ),
    "api.feature-auth.shop.localhost",
  );
  assert.equal(
    buildServiceStackHostname(
      { projectName: "shop", workspaceRootLabel: "Repository Root" },
      service,
    ),
    "api.root.shop.localhost",
  );
  assert.equal(
    buildServiceStackUrl(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      { slug: "app" },
    ),
    "http://app.feature-auth.shop.localhost:1355",
  );
});

test("buildServiceStackHostname truncates long segments deterministically", () => {
  const [service] = applyDerivedServiceFields([
    {
      id: "service",
      name: "",
      slug: "",
      relativePath: "apps/this-service-name-is-extremely-long-and-needs-truncation",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
  ]);
  const stack = {
    projectName: "project-name-that-keeps-going-and-going",
    workspaceRootLabel: "feature/this-branch-name-is-way-too-long-to-fit-as-is",
  };

  const hostname = buildServiceStackHostname(stack, service);
  const segments = hostname.split(".");

  assert.equal(hostname, buildServiceStackHostname(stack, service));
  assert.equal(segments.at(-1), "localhost");
  assert.equal(segments.slice(0, 3).every((segment) => segment.length <= HOSTNAME_SEGMENT_MAX_LENGTH), true);
});
