import { z } from 'zod';

// ------------------------------------------------------------------
// Types (Ported from thinking-logger-ui)
// ------------------------------------------------------------------

export type SessionSummary = {
    id: string;
    title: string;
    started_at?: string | undefined;
    ended_at?: string | undefined;
    platform?: 'cursor' | 'vscode' | 'chatgpt' | 'claude' | 'github' | string | undefined;
    project?: string | undefined;
    git_branch?: string | undefined;
    approval_pending_since?: string | undefined;
    workspace_path?: string | undefined;
    chat_id?: string | undefined;
    status: 'in_progress' | 'done';
};

export const SessionSummarySchema = z.object({
    id: z.string(),
    title: z.string(),
    started_at: z.string().optional(),
    ended_at: z.string().optional(),
    platform: z.string().optional(),
    project: z.string().optional(),
    git_branch: z.string().optional(),
    approval_pending_since: z.string().optional(),
    workspace_path: z.string().optional(),
    chat_id: z.string().optional(),
    status: z.union([z.literal('in_progress'), z.literal('done')]),
}) as z.ZodType<SessionSummary>;

// ------------------------------------------------------------------
// RPC Client Logic
// ------------------------------------------------------------------

export class RpcError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly retriable: boolean;

    constructor(message: string, status: number, code?: string, retriable = false) {
        super(message);
        this.status = status;
        if (code !== undefined) {
            this.code = code;
        }
        this.retriable = retriable;
    }
}

interface InitializeResult {
    readonly sessionId: string;
    readonly protocolVersion: string;
}

const InitializeSchema = z.object({
    result: z
        .object({ protocolVersion: z.string().default('2025-06-18') })
        .optional()
        .default({ protocolVersion: '2025-06-18' }),
});

async function fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number }): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 10000);
    try {
        const resp = await fetch(url, { ...init, signal: controller.signal });
        return resp;
    } finally {
        clearTimeout(timeout);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

function jitter(baseMs: number): number {
    return Math.floor(baseMs * (0.8 + Math.random() * 0.4));
}

/**
 * Initialize connection with the MCP User Service
 */
export async function initialize(params: { baseUrl: string; token: string }): Promise<InitializeResult> {
    const resp = await fetchWithTimeout(params.baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'init-ui',
            method: 'initialize',
            params: {
                protocolVersion: '2025-06-18',
                capabilities: {},
                clientInfo: { name: 'galactic-ide-ui', version: '0.1.0' },
            },
        }),
        timeoutMs: 10000,
    });

    if (!resp.ok) throw new RpcError(`HTTP ${resp.status}`, resp.status, undefined, resp.status >= 500);

    const body = await resp.json().catch(() => ({}));
    const parsed = InitializeSchema.safeParse(body);
    const sessionId = resp.headers.get('mcp-session-id') || '';

    if (!sessionId) throw new RpcError('Missing mcp-session-id', 500, undefined, true);

    return { sessionId, protocolVersion: parsed.success ? parsed.data.result.protocolVersion : '2025-06-18' };
}

const ReadSessionsSchema = z.object({
    result: z.object({ contents: z.array(z.object({ text: z.string().or(z.unknown()) })).default([]) }).default({ contents: [] }),
});

/**
 * Read active sessions from the 'thinking://sessions' resource
 */
export async function readClientSessions(params: {
    baseUrl: string;
    token: string;
    sessionId: string;
    protocolVersion: string;
}): Promise<SessionSummary[]> {
    const doFetch = async (): Promise<SessionSummary[]> => {
        const resp = await fetchWithTimeout(params.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
                'mcp-session-id': params.sessionId,
                'mcp-protocol-version': params.protocolVersion,
                Authorization: `Bearer ${params.token}`,
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'read-sessions',
                method: 'resources/read',
                params: { uri: 'thinking://sessions' },
            }),
            timeoutMs: 10000,
        });

        if (!resp.ok) throw new RpcError(`HTTP ${resp.status}`, resp.status, undefined, resp.status >= 500);

        const json = await resp.json();
        const parsed = ReadSessionsSchema.safeParse(json);
        const rawText = parsed.success ? parsed.data.result.contents[0]?.text ?? '[]' : '[]';
        // Accessing text directly or parsing if it's a string JSON representation
        const arr: unknown = typeof rawText === 'string' ? JSON.parse(rawText) : [];

        if (!Array.isArray(arr)) return [];

        // Coerce and map to SessionSummary shape
        const sessions: SessionSummary[] = [];
        for (const item of arr) {
            const s = SessionSummarySchema.safeParse({
                id: String((item as any)?.id ?? ''),
                title: String((item as any)?.title ?? 'Untitled task'),
                started_at: (item as any)?.started_at ? String((item as any)?.started_at) : (undefined as string | undefined),
                ended_at: (item as any)?.ended_at ? String((item as any)?.ended_at) : (undefined as string | undefined),
                platform: (item as any)?.platform ? String((item as any)?.platform) : (undefined as string | undefined),
                project: (item as any)?.project ? String((item as any)?.project) : (undefined as string | undefined),
                git_branch: (item as any)?.git_branch ? String((item as any)?.git_branch) : (undefined as string | undefined),
                approval_pending_since: (item as any)?.approval_pending_since ? String((item as any)?.approval_pending_since) : (undefined as string | undefined),
                workspace_path: (item as any)?.workspace_path ? String((item as any)?.workspace_path) : (undefined as string | undefined),
                chat_id: (item as any)?.chat_id ? String((item as any)?.chat_id) : (undefined as string | undefined),
                status: (item as any)?.ended_at ? 'done' : 'in_progress',
            });
            if (s.success) sessions.push(s.data);
        }
        return sessions;
    };

    // Basic retry for transient errors
    const maxAttempts = 3;
    let attempt = 0;
    while (true) {
        try {
            return await doFetch();
        } catch (err) {
            attempt += 1;
            const status = (err as RpcError)?.status ?? 0;
            const retriable = (err as RpcError)?.retriable ?? (status >= 500 || status === 0);
            if (attempt >= maxAttempts || !retriable) throw err;
            await sleep(jitter(300 * attempt));
        }
    }
}
