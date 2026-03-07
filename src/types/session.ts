export interface SessionSummary {
  id: string;
  title: string;
  started_at?: string;
  ended_at?: string;
  platform?: string;
  git_branch?: string;
  approval_pending_since?: string;
  workspace_path?: string;
  chat_id?: string;
  estimated_duration?: number;
  status: "in_progress" | "done";
}
