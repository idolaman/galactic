import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mac notifier helper plist declares the shared app icon", async () => {
  const plist = await readFile("macos/GalacticNotifier/Info.plist", "utf-8");

  assert.match(plist, /<key>CFBundleIconName<\/key>\s*<string>AppIcon<\/string>/);
});

test("mac notifier helper plist versions come from Xcode build settings", async () => {
  const plist = await readFile("macos/GalacticNotifier/Info.plist", "utf-8");

  assert.match(plist, /<key>CFBundleShortVersionString<\/key>\s*<string>\$\(MARKETING_VERSION\)<\/string>/);
  assert.match(plist, /<key>CFBundleVersion<\/key>\s*<string>\$\(CURRENT_PROJECT_VERSION\)<\/string>/);
});

test("mac notifier build script leaves icon packaging to the Xcode target", async () => {
  const script = await readFile("scripts/build-mac-notifier.sh", "utf-8");

  assert.match(script, /xcodebuild/);
  assert.doesNotMatch(script, /iconutil/);
  assert.doesNotMatch(script, /tiff2icns/);
  assert.doesNotMatch(script, /sips -z/);
});

test("mac notifier build script stamps the helper version from package.json", async () => {
  const script = await readFile("scripts/build-mac-notifier.sh", "utf-8");

  assert.match(script, /APP_VERSION="\$\(node -p "require\('\.\/package\.json'\)\.version"\)"/);
  assert.match(script, /CURRENT_PROJECT_VERSION="\$APP_VERSION"/);
  assert.match(script, /MARKETING_VERSION="\$APP_VERSION"/);
});

test("mac notifier Xcode project bundles the committed asset catalog app icon", async () => {
  const project = await readFile("macos/GalacticNotifier.xcodeproj/project.pbxproj", "utf-8");

  assert.match(project, /Assets\.xcassets \*\/ = \{isa = PBXFileReference; lastKnownFileType = folder\.assetcatalog;/);
  assert.match(project, /Assets\.xcassets in Resources/);
  assert.match(project, /ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;/);
});

test("mac notifier Xcode project keeps consistent version defaults", async () => {
  const project = await readFile("macos/GalacticNotifier.xcodeproj/project.pbxproj", "utf-8");
  const currentProjectVersions = [
    ...project.matchAll(/CURRENT_PROJECT_VERSION = ([0-9]+(?:\.[0-9]+)*);/g),
  ].map((match) => match[1]);
  const marketingVersions = [
    ...project.matchAll(/MARKETING_VERSION = ([0-9]+(?:\.[0-9]+)*);/g),
  ].map((match) => match[1]);

  assert.equal(currentProjectVersions.length, 2);
  assert.equal(marketingVersions.length, 2);
  assert.deepEqual(new Set(currentProjectVersions).size, 1);
  assert.deepEqual(new Set(marketingVersions).size, 1);
  assert.equal(currentProjectVersions[0], marketingVersions[0]);
});

test("electron-builder bundles the notifier as a standalone login item helper", async () => {
  const builderConfig = await readFile("electron-builder.yml", "utf-8");

  assert.match(builderConfig, /from: resources\/mac-notifier\/Galactic Notifier\.app/);
  assert.match(builderConfig, /to: Library\/LoginItems\/Galactic Notifier\.app/);
});
