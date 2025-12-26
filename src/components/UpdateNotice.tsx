import { ArrowDownToLine, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdate } from "@/hooks/use-update";
import { cn } from "@/lib/utils";

export const UpdateNotice = () => {
  const { state, installUpdate, checkForUpdates } = useUpdate();

  if (
    state.status === "idle" ||
    state.status === "checking" ||
    state.status === "not-available" ||
    state.status === "unsupported"
  ) {
    return null;
  }

  const versionLabel = state.version ? `v${state.version}` : "new version";
  const isReady = state.status === "downloaded";
  const isError = state.status === "error";

  return (
    <div
      className={cn(
        "mx-4 mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-gradient-to-r from-indigo-900/40 via-slate-900/70 to-slate-900/40 px-3 py-2 text-sm shadow-lg",
        "backdrop-blur supports-[backdrop-filter]:bg-slate-900/60",
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-200 border border-indigo-500/30">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-white">
          {isReady ? "Update ready to install" : isError ? "Update check failed" : "Update downloading"}
        </span>
        <span className="text-xs text-slate-300">
          {isError
            ? state.message ?? "Unable to fetch updates."
            : isReady
              ? `Install ${versionLabel} now and restart.`
              : `Fetching ${versionLabel}... you can keep working.`}
        </span>
      </div>
      {isReady ? (
        <Button size="sm" variant="secondary" className="gap-2" onClick={installUpdate}>
          <ArrowDownToLine className="h-4 w-4" />
          Install & Restart
        </Button>
      ) : isError ? (
        <Button size="sm" variant="outline" className="gap-2" onClick={checkForUpdates}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-xs text-indigo-200">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Downloading…
        </div>
      )}
    </div>
  );
};
