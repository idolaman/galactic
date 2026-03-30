import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const distElectronPath = path.resolve(scriptDirectory, "../dist-electron");

await rm(distElectronPath, { force: true, recursive: true });
