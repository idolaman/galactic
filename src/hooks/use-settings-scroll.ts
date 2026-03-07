import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const useSettingsScroll = () => {
  const location = useLocation();
  const [highlightHotkey, setHighlightHotkey] = useState(false);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) {
      return;
    }

    const element = document.getElementById(hash);
    if (!element) {
      return;
    }

    setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth" });
      if (hash === "global-hotkey") {
        setHighlightHotkey(true);
        setTimeout(() => setHighlightHotkey(false), 2000);
      }
    }, 100);
  }, [location.hash]);

  return { highlightHotkey };
};
