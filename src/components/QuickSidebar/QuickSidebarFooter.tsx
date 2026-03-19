export function QuickSidebarFooter() {
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-[#0A0A15]/80 px-3 py-1.5 text-[10px] text-white/30 backdrop-blur-md">
      <div className="flex gap-2">
        <span className="flex items-center gap-1">
          <span className="text-white/50">↑↓</span>
          nav
        </span>
        <span className="flex items-center gap-1">
          <span className="text-white/50">↵</span>
          open
        </span>
        <span className="flex items-center gap-1">
          <span className="text-white/50">⌘⌫</span>
          del
        </span>
      </div>
      <span className="flex items-center gap-1">
        <span className="text-white/50">esc</span>
        close
      </span>
    </div>
  );
}
