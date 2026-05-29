import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const useSettingsHotkeyHighlight = () => {
  const location = useLocation();
  const [highlightHotkey, setHighlightHotkey] = useState(false);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const id = location.hash.replace("#", "");
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    const scrollTimer = window.setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth" });
      if (id !== "global-hotkey") {
        return;
      }

      showTimer = window.setTimeout(() => setHighlightHotkey(true), 500);
      hideTimer = window.setTimeout(() => setHighlightHotkey(false), 2500);
    }, 100);

    return () => {
      window.clearTimeout(scrollTimer);
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [location.hash]);

  return highlightHotkey;
};
