#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const owner = process.env.GITHUB_OWNER ?? "idolaman";
const repo = process.env.GITHUB_REPO ?? "galactic-binaries";
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;

if (!token) {
  console.error("Missing GH_TOKEN or GITHUB_TOKEN.");
  process.exit(1);
}

const packageJsonPath = path.resolve("package.json");
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
const version = packageJson?.version;

if (!version) {
  console.error("Unable to read version from package.json.");
  process.exit(1);
}

const tag = process.env.GITHUB_RELEASE_TAG ?? version;
const apiBase = "https://api.github.com";
const headers = {
  Authorization: `token ${token}`,
  "User-Agent": "galactic-release",
  Accept: "application/vnd.github+json",
};

const fetchJson = async (url, init = {}) => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }
  return response.json();
};

const getReleaseByTag = async () => {
  const response = await fetch(`${apiBase}/repos/${owner}/${repo}/releases/tags/${tag}`, {
    headers,
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }
  return response.json();
};

const createRelease = async () => {
  return await fetchJson(`${apiBase}/repos/${owner}/${repo}/releases`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tag_name: tag,
      name: tag,
      draft: false,
      prerelease: false,
    }),
  });
};

const release = (await getReleaseByTag()) ?? (await createRelease());
const assets = await fetchJson(`${apiBase}/repos/${owner}/${repo}/releases/${release.id}/assets`, {
  headers,
});

const releaseDir = path.resolve("release");
const entries = await fs.readdir(releaseDir, { withFileTypes: true });
const allowedExtensions = [".yml", ".zip", ".blockmap", ".dmg"];

const isLatestDescriptor = (name) =>
  name.startsWith("latest-") && name.endsWith(".yml");
const matchesVersion = (name) =>
  name.includes(`-${version}-`) || name.includes(`-${version}.`);

const files = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => !name.startsWith("builder-"))
  .filter((name) => allowedExtensions.some((ext) => name.endsWith(ext)))
  .filter((name) => isLatestDescriptor(name) || matchesVersion(name))
  .map((name) => ({ name, filePath: path.join(releaseDir, name) }));

if (files.length === 0) {
  console.error("No release assets found in release/.");
  process.exit(1);
}

const deleteAsset = async (assetId) => {
  await fetchJson(`${apiBase}/repos/${owner}/${repo}/releases/assets/${assetId}`, {
    method: "DELETE",
    headers,
  });
};

const uploadAsset = async ({ name, filePath }) => {
  const data = await fs.readFile(filePath);
  const uploadUrl = release.upload_url.replace("{?name,label}", `?name=${encodeURIComponent(name)}`);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "galactic-release",
      "Content-Type": "application/octet-stream",
      "Content-Length": String(data.length),
    },
    body: data,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upload failed (${name}) ${response.status}: ${body}`);
  }
};

for (const file of files) {
  const existing = assets.find((asset) => asset.name === file.name);
  if (existing) {
    console.log(`Replacing ${file.name}`);
    await deleteAsset(existing.id);
  } else {
    console.log(`Uploading ${file.name}`);
  }
  await uploadAsset(file);
}

console.log(`Release ${tag} published to ${owner}/${repo}.`);
