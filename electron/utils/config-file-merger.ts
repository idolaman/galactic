import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

type MergeResult =
    | { success: true; content: string }
    | { success: false; error: string };

type WriteResult =
    | { success: true }
    | { success: false; error: string };

const IP_PLACEHOLDER = /\{\{IP\}\}/g;

const isObject = (value: unknown): value is Record<string, YamlValue> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const deepMerge = (target: YamlValue, source: YamlValue): YamlValue => {
    if (!isObject(target) || !isObject(source)) {
        return source;
    }

    const result: Record<string, YamlValue> = { ...target };

    for (const key of Object.keys(source)) {
        const sourceVal = source[key];
        const targetVal = result[key];

        if (isObject(sourceVal) && isObject(targetVal)) {
            result[key] = deepMerge(targetVal, sourceVal);
        } else {
            result[key] = sourceVal;
        }
    }

    return result;
};

const replaceIpPlaceholders = (content: string, ip: string): string =>
    content.replace(IP_PLACEHOLDER, ip);

export const parseYaml = (content: string): YamlValue => {
    const parsed = yaml.load(content);
    if (parsed === undefined) return {};
    return parsed as YamlValue;
};

export const serializeYaml = (obj: YamlValue): string =>
    yaml.dump(obj, { indent: 2, lineWidth: -1, noRefs: true });

export const mergeConfigContent = (
    existingContent: string | null,
    newContent: string,
    ip: string
): MergeResult => {
    try {
        const processedNewContent = replaceIpPlaceholders(newContent, ip);
        const newParsed = parseYaml(processedNewContent);

        if (existingContent === null || existingContent.trim() === "") {
            return { success: true, content: serializeYaml(newParsed) };
        }

        const existingParsed = parseYaml(existingContent);
        const merged = deepMerge(existingParsed, newParsed);

        return { success: true, content: serializeYaml(merged) };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to parse YAML";
        return { success: false, error: message };
    }
};

export const isPathSafe = (basePath: string, relativePath: string): boolean => {
    const normalizedBase = path.resolve(basePath);
    const fullPath = path.resolve(basePath, relativePath);
    return fullPath.startsWith(normalizedBase + path.sep) || fullPath === normalizedBase;
};

export const readConfigFile = async (
    projectPath: string,
    relativePath: string
): Promise<string | null> => {
    if (!isPathSafe(projectPath, relativePath)) {
        throw new Error("Path traversal detected");
    }

    const fullPath = path.join(projectPath, relativePath);

    if (!existsSync(fullPath)) {
        return null;
    }

    return fs.readFile(fullPath, "utf-8");
};

export const writeConfigFile = async (
    projectPath: string,
    relativePath: string,
    content: string
): Promise<WriteResult> => {
    if (!isPathSafe(projectPath, relativePath)) {
        return { success: false, error: "Path traversal detected" };
    }

    const fullPath = path.join(projectPath, relativePath);

    try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, "utf-8");
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to write file";
        return { success: false, error: message };
    }
};

export const applyConfigFile = async (
    projectPath: string,
    relativePath: string,
    newContent: string,
    ip: string
): Promise<WriteResult> => {
    try {
        const existingContent = await readConfigFile(projectPath, relativePath);
        const mergeResult = mergeConfigContent(existingContent, newContent, ip);

        if (!mergeResult.success) {
            return { success: false, error: mergeResult.error };
        }

        return writeConfigFile(projectPath, relativePath, mergeResult.content);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to apply config";
        return { success: false, error: message };
    }
};
