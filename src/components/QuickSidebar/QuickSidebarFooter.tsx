export function QuickSidebarFooter() {
  return (
    <div className="flex shrink-0 items-center justify-between border-t bg-card px-3 py-1.5 text-[10px] text-muted-foreground">
      <div className="flex gap-2">
        <span className="flex items-center gap-1">
          <span className="text-foreground">↑↓</span>
          nav
        </span>
        <span className="flex items-center gap-1">
          <span className="text-foreground">↵</span>
          open
        </span>
        <span className="flex items-center gap-1">
          <span className="text-foreground">⌘⌫</span>
          del
        </span>
      </div>
      <span className="flex items-center gap-1">
        <span className="text-foreground">esc</span>
        close
      </span>
    </div>
  );
}
