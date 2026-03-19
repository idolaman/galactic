export interface ClaudeHookSessionSummary {
  id: string;
  title: string;
  started_at?: string;
  ended_at?: string;
  platform: "claude";
  project?: string;
  git_branch?: string;
  approval_pending_since?: string;
  workspace_path?: string;
  chat_id?: string;
  estimated_duration?: number;
  status: "in_progress" | "done";
}

export type ClaudeHookEvent =
  | {
      event: "session.started";
      id: string;
      title: string;
      started_at: string;
      platform: "claude";
      workspace_path?: string;
      chat_id: string;
    }
  | { event: "approval.pending"; id: string; at: string }
  | { event: "approval.cleared"; id: string }
  | { event: "session.finished"; id: string; ended_at: string };

export interface ClaudeHookSnapshot {
  installed: boolean;
  sessions: ClaudeHookSessionSummary[];
}
