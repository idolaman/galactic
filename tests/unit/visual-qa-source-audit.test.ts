import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import {
  findVisualQaSourceViolations,
  type VisualQaSourceFile,
} from "../../src/lib/visual-qa-source-audit.js";

const sourceRoots = ["src/pages", "src/components", "src/index.css"];
const sourceExtensions = new Set([".ts", ".tsx", ".css"]);

const collectSourceFiles = (path: string): VisualQaSourceFile[] => {
  if (statSync(path).isFile()) {
    return [{
      content: readFileSync(path, "utf8"),
      path: relative(process.cwd(), path),
    }];
  }

  return readdirSync(path).flatMap((entry) => {
    const nextPath = join(path, entry);
    if (statSync(nextPath).isDirectory()) {
      return collectSourceFiles(nextPath);
    }

    const extension = nextPath.slice(nextPath.lastIndexOf("."));
    return sourceExtensions.has(extension) ? collectSourceFiles(nextPath) : [];
  });
};

test("findVisualQaSourceViolations flags decorative product UI patterns", () => {
  const violations = findVisualQaSourceViolations([
    {
      content: 'className="bg-gradient-to-r from-indigo-500 to-purple-600 shadow-2xl"',
      path: "src/pages/Example.tsx",
    },
  ]);

  assert.deepEqual(
    violations.map((violation) => violation.id),
    ["large-shadow", "tailwind-gradient"],
  );
});

test("findVisualQaSourceViolations allows token-driven operational styling", () => {
  const violations = findVisualQaSourceViolations([
    {
      content: 'className="rounded-md border bg-card text-card-foreground shadow-sm"',
      path: "src/components/Example.tsx",
    },
  ]);

  assert.deepEqual(violations, []);
});

test("redesigned product source avoids banned decorative visual patterns", () => {
  const sourceFiles = sourceRoots.flatMap((sourceRoot) =>
    collectSourceFiles(join(process.cwd(), sourceRoot)),
  );

  assert.deepEqual(findVisualQaSourceViolations(sourceFiles), []);
});
