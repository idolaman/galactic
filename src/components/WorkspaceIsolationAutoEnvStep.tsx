import { Terminal, Zap } from "lucide-react";
import { WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION } from "@/lib/workspace-isolation-support";

const autoEnvItems = [
  {
    icon: Terminal,
    title: "Why Terminal Auto-Env is required",
    description:
      "Project Services routes clean local domains back to service ports behind the scenes. Your terminal needs the right HOST and PORT values when you run dev commands.",
  },
  {
    icon: Zap,
    title: "What enabling it does",
    description:
      "Galactic adds a managed zsh hook to ~/.zshrc. When you cd into a service folder, it automatically exports the correct environment values for that workspace.",
  },
] as const;

export const WorkspaceIsolationAutoEnvStep = () => (
  <div className="flex flex-1 flex-col justify-center gap-6 py-4">
    <div className="space-y-4">
      {autoEnvItems.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex gap-4">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-500">
      Terminal Auto-Env currently supports zsh only. Galactic updates a managed
      block in your ~/.zshrc and you can disable it later from Settings. After
      enabling it, {WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION.toLowerCase()}
    </div>
  </div>
);
