import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import * as toml from "smol-toml";

interface StdioServerConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}

interface HttpServerConfig {
    type: "http" | "sse";
    url: string;
}

type McpServerConfig = StdioServerConfig | HttpServerConfig;

interface McpConfig {
    mcpServers?: Record<string, McpServerConfig>;
    mcp_servers?: Record<string, McpServerConfig>;
}

type UpdateResult =
    | { success: true }
    | { success: false; error: string };

const isTomlFile = (filePath: string) => filePath.endsWith(".toml");

const parseConfig = (content: string, isToml: boolean): McpConfig =>
    isToml ? toml.parse(content) : JSON.parse(content);

const serializeConfig = (config: McpConfig, isToml: boolean): string =>
    isToml ? toml.stringify(config) : JSON.stringify(config, null, 2);

const getServersKey = (isToml: boolean): keyof McpConfig =>
    isToml ? "mcp_servers" : "mcpServers";

const readConfigFile = async (configPath: string): Promise<McpConfig> => {
    if (!existsSync(configPath)) return {};

    try {
        const content = await fs.readFile(configPath, "utf-8");
        return parseConfig(content, isTomlFile(configPath));
    } catch {
        console.warn(`MCP config at ${configPath} corrupt or empty, starting fresh`);
        return {};
    }
};

export const updateMcpConfig = async (
    configPath: string,
    serverName: string,
    serverConfig: McpServerConfig
): Promise<UpdateResult> => {
    try {
        await fs.mkdir(path.dirname(configPath), { recursive: true });

        const config = await readConfigFile(configPath);
        const serversKey = getServersKey(isTomlFile(configPath));

        config[serversKey] = {
            ...config[serversKey],
            [serverName]: serverConfig
        };

        await fs.writeFile(
            configPath,
            serializeConfig(config, isTomlFile(configPath)),
            "utf-8"
        );

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to update MCP config at ${configPath}:`, message);
        return { success: false, error: message };
    }
};

export const checkMcpConfig = async (
    configPath: string,
    serverName: string
): Promise<boolean> => {
    try {
        const config = await readConfigFile(configPath);
        const serversKey = getServersKey(isTomlFile(configPath));
        return serverName in (config[serversKey] ?? {});
    } catch {
        return false;
    }
};
